import time
from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def hello_world(self):
        self.client.get("/")
        self.client.get("/api/docs")

    @task(3)
    def view_items(self):
        
        for item_id in range(10):
            self.client.get(f"/api/v1/cooperatives")
            time.sleep(1)

    def on_start(self):
        self.client.post("/api/v1/auth/login", json={"username":"foo@example.com", "password":"bar"})