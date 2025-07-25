import subprocess
import sys
import uvicorn

def run_tests():
    print("Running tests before starting the server...\n")
    result = subprocess.run(["pytest",], stdout=sys.stdout, stderr=sys.stderr)
    # subprocess.run(["pytest", "-m", "essential"])    ---- Run only essential tests 
    return result.returncode == 0

if __name__ == "__main__":
    if run_tests():
        print("\n✅ Tests passed. Starting server...")
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        print("\n❌ Tests failed. Server not starting.")
        sys.exit(1)
