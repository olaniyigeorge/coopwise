import subprocess
import sys
import uvicorn

from app.utils.logger import logger


#!/usr/bin/env python3
"""
Start script for Revela Backend Services
Memory-optimized for 512MB Render instances with stdout logging
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path

# Color codes for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    MAGENTA = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

def print_colored(message, color):
    """Print colored message to terminal"""
    print(f"{color}{message}{Colors.NC}", flush=True)

def print_success(message):
    print_colored(f"✓ {message}", Colors.GREEN)

def print_info(message):
    print_colored(f"ℹ {message}", Colors.BLUE)

def print_warning(message):
    print_colored(f"⚠ {message}", Colors.YELLOW)

def print_error(message):
    print_colored(f"✗ {message}", Colors.RED)

def print_service(service_name, message):
    """Print service-specific log with color coding"""
    colors = {
        'celery_worker': Colors.CYAN,
        'celery_beat': Colors.MAGENTA,
        'api': Colors.GREEN
    }
    color = colors.get(service_name, Colors.BLUE)
    print_colored(f"[{service_name}] {message}", color)

class ServiceManager:
    def __init__(self):
        self.processes = {}
        self.base_dir = Path(__file__).parent.absolute()
        
        # Set PYTHONPATH
        os.environ['PYTHONPATH'] = str(self.base_dir)
        
        # Check if running on Render
        self.is_render = os.getenv('RENDER') is not None
        self.port = os.getenv('PORT', '8000')
        
        # Force unbuffered output
        os.environ['PYTHONUNBUFFERED'] = '1'
        
    def check_redis(self):
        """Check if Redis is accessible (skip on Render)"""
        if self.is_render:
            redis_url = os.getenv('REDIS_URL')
            if not redis_url:
                print_error("REDIS_URL environment variable not set!")
                return False
            # Redact password in logs
            safe_url = redis_url.split('@')[0] + '@***' if '@' in redis_url else '***'
            print_info(f"Redis URL configured: {safe_url}")
            return True
            
        try:
            result = subprocess.run(
                ['redis-cli', 'ping'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and 'PONG' in result.stdout:
                print_success("Redis is running")
                return True
            else:
                print_warning("Redis is not responding")
                return False
        except FileNotFoundError:
            print_warning("redis-cli not found, skipping Redis check")
            return True
        except Exception as e:
            print_warning(f"Could not check Redis: {e}")
            return True
    
    def start_celery_worker(self):
        """Start Celery worker process - logs to stdout"""
        print_info("Starting Celery Worker...")
        
        # Memory-optimized settings for Render
        if self.is_render:
            concurrency = '1'  # Single worker on 512MB
            pool = 'solo'  # Most memory efficient pool
            max_tasks_per_child = '50'
        else:
            concurrency = os.getenv('CELERY_WORKERS', '2')
            pool = 'prefork'
            max_tasks_per_child = '1000'
        
        cmd = [
            'celery',
            '-A', 'src.core.celery_app.celery_app',
            'worker',
            '--loglevel=info',
            f'--concurrency={concurrency}',
            f'--pool={pool}',
            f'--max-tasks-per-child={max_tasks_per_child}',
        ]
        
        # Additional memory optimizations
        if self.is_render:
            cmd.extend([
                '--without-gossip',
                '--without-mingle',
                '--without-heartbeat',
                '--max-memory-per-child=150000',
            ])
        
        # Output directly to stdout/stderr (no file logging)
        process = subprocess.Popen(
            cmd,
            stdout=sys.stdout,
            stderr=sys.stderr,
            cwd=self.base_dir,
            bufsize=0  # Unbuffered
        )

        self.processes['celery_worker'] = {
            'process': process,
            'name': 'Celery Worker'
        }

        print_success(f"Celery Worker started (PID: {process.pid})")
        if self.is_render:
            print_info(f"Config: pool={pool}, concurrency={concurrency}")

        return process
    
    def run_tests(self):
        logger.info("Running tests before starting the server...\n")
        result = subprocess.run(
            ["pytest", "-m", "essential"]
        )  # ---- Run only essential tests
        return result.returncode == 0

    
    def start_celery_beat(self):
        """Start Celery beat scheduler - logs to stdout"""
        print_info("Starting Celery Beat Scheduler...")
        
        cmd = [
            'celery',
            '-A', 'src.core.celery_app.celery_app',
            'beat',
            '--loglevel=info'
        ]
        
        # Use max_interval to reduce memory overhead
        if self.is_render:
            cmd.append('--max-interval=60')
        
        # Output directly to stdout/stderr
        process = subprocess.Popen(
            cmd,
            stdout=sys.stdout,
            stderr=sys.stderr,
            cwd=self.base_dir,
            bufsize=0
        )
        
        self.processes['celery_beat'] = {
            'process': process,
            'name': 'Celery Beat'
        }
        
        print_success(f"Celery Beat started (PID: {process.pid})")
        return process
    
    def start_api(self):
        """Start FastAPI server - logs to stdout"""
        print_info("Starting FastAPI server...")
        
        cmd = [
            'uvicorn',
            'main:app',
            '--host', '0.0.0.0',
            '--port', self.port,
            '--log-level', 'info'
        ]
        
        if self.is_render:
            # Single worker for 512MB instance
            workers = os.getenv('UVICORN_WORKERS', '1')
            cmd.extend([
                '--workers', workers,
                '--limit-concurrency', '10',
                '--timeout-keep-alive', '5',
                '--no-access-log' if os.getenv('DISABLE_ACCESS_LOG') else '--access-log'
            ])
            print_info(f"Uvicorn workers: {workers}")
        else:
            # Development settings
            cmd.append('--reload')
        
        # Output directly to stdout/stderr
        process = subprocess.Popen(
            cmd,
            stdout=sys.stdout,
            stderr=sys.stderr,
            cwd=self.base_dir,
            bufsize=0
        )
        
        self.processes['api'] = {
            'process': process,
            'name': 'FastAPI'
        }
        
        print_success(f"FastAPI server started (PID: {process.pid})")
        return process
    
    def cleanup(self, signum=None, frame=None):
        """Stop all running processes"""
        print_info("\nShutting down services...")
        
        for service_name, service_data in self.processes.items():
            process = service_data['process']
            name = service_data['name']
            
            if process and process.poll() is None:
                print_info(f"Stopping {name}...")
                try:
                    process.terminate()
                    process.wait(timeout=10)
                    print_success(f"{name} stopped")
                except subprocess.TimeoutExpired:
                    print_warning(f"Force killing {name}...")
                    process.kill()
                    process.wait()
                except Exception as e:
                    print_error(f"Error stopping {name}: {e}")
        
        print_success("All services stopped")
        sys.exit(0)

    def start_all(self, run_tests=True):
        """Start all services"""
        print_colored("=" * 60, Colors.GREEN)
        print_colored("  Coopwise Backend Services", Colors.GREEN)
        print_colored("=" * 60, Colors.GREEN)
        
        if self.is_render:
            print_warning("🚀 PRODUCTION MODE (512MB optimized, logs to stdout)")
        else:
            print_info("🔧 DEVELOPMENT MODE")
        
        
        if run_tests:
            if self.run_tests():
                logger.info("\n✅ Tests passed. Starting server...")
                uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
            else:
                logger.info("\n❌ Tests failed. Server not starting.")
                sys.exit(1)

        # Check Redis connection
        if not self.check_redis():
            print_error("Redis check failed! Exiting...")
            sys.exit(1)
        
        # Register signal handlers
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        
        try:
            # Start services with delays
            self.start_celery_worker()
            time.sleep(3)
            
            self.start_celery_beat()
            time.sleep(2)
            
            self.start_api()
            time.sleep(2)
            
            print_colored("=" * 60, Colors.GREEN)
            print_success("✅ All services running!")
            print_colored("=" * 60, Colors.GREEN)
            print(f"🌐 API Server: http://0.0.0.0:{self.port}")
            print(f"📊 Environment: {'Production (Render)' if self.is_render else 'Development'}")
            print_warning("⏹  Press Ctrl+C to stop all services")
            print_colored("=" * 60, Colors.GREEN)
            
            # Monitor processes
            self.monitor_processes()
            
        except Exception as e:
            print_error(f"Error starting services: {e}")
            import traceback
            traceback.print_exc()
            self.cleanup()
    
    def monitor_processes(self):
        """Monitor running processes and restart if needed"""
        print_info("👀 Monitoring processes...\n")
        
        check_interval = 10 if self.is_render else 5
        health_log_interval = 60  # Log health every 60 seconds in production
        last_health_log = time.time()
        
        while True:
            try:
                time.sleep(check_interval)
                
                current_time = time.time()
                all_running = True
                
                for service_name, service_data in list(self.processes.items()):
                    process = service_data['process']
                    name = service_data['name']
                    
                    if process.poll() is not None:
                        all_running = False
                        print_error(f"💥 {name} crashed! (exit code: {process.returncode})")
                        
                        if not self.is_render:
                            print_error("Development mode: stopping all services")
                            self.cleanup()
                        else:
                            print_warning(f"Production mode: attempting to restart {name}...")
                            time.sleep(2)
                            
                            # Restart the crashed service
                            if service_name == 'celery_worker':
                                self.start_celery_worker()
                            elif service_name == 'celery_beat':
                                self.start_celery_beat()
                            elif service_name == 'api':
                                self.start_api()
                
                # Periodic health log in production
                if all_running and self.is_render:
                    if current_time - last_health_log >= health_log_interval:
                        print_success("💚 All services healthy")
                        last_health_log = current_time
                        
            except KeyboardInterrupt:
                raise
            except Exception as e:
                print_error(f"Error in monitor: {e}")
                time.sleep(5)

def main():
    """Main entry point"""
    # Ensure unbuffered output
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
    
    manager = ServiceManager()
    manager.start_all()

if __name__ == '__main__':
    main()

