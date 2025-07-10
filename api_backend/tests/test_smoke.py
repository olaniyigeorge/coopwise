from fastapi.testclient import TestClient
from main import app

client  = TestClient(app)






def test_sanity():
    assert 2 + 2 == 4

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
