import requests
import json
import os

DATA_FILE = "data.json"
DOMAIN = "https://admin.swaragh.com"
BASEPATH = "/api"
HEADERS = {
    "Content-Type": "application/json"
}

data = {}

if os.path.exists(DATA_FILE):
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
    except (json.JSONDecodeError, ValueError):
        data = {}
else:
    data = {}


def writeDataToFile(filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)


def sendRequest (url, body):
    fullurl = DOMAIN + BASEPATH + url
    response = requests.post(fullurl, json=body, headers=HEADERS, verify=False)
    print(response.status_code, fullurl)
    
    structuredData = {
        "url" : fullurl,
        "body" : body,
        "data" : response.json()["data"]
    }    

    return structuredData

def ensure_dict(parent: dict, key: str) -> dict:
    if not isinstance(parent.get(key), dict):
        parent[key] = {}
    return parent[key]


def checkAndUpdate(checkData, path, body):
    checkedData = checkData.get("data") if isinstance(checkData, dict) else None
    if not checkedData:
        checkData = sendRequest(path, body)
    writeDataToFile("data.json")




organization = ensure_dict(data, "organization")
checkAndUpdate(organization, "/organizations", 
                {
                    "name": "Google",
                    "owner_keycloak_id": "keyClockUserId",
                    "email": "gururaj.hr@swaragh.co.in",
                    "phone": "9880699054",
                    "description": "Every where we are.",
                    "state": "active"
                }
    )




project = ensure_dict(data, "project")
checkAndUpdate(
    project,
    '/project',
    {
        "name" : "Project PMS",
        "short_name" : "project",
        "sub_domain" : "new-pro"
    }
)


module = ensure_dict(data, "module")
checkAndUpdate(
     module,
    '/modules',
    {
        "name" : "Porject managemane system python",
        "code" : "pms_server",
        "description" : "asset", 
        "docker_container" : "pms_noder",
        "port" : "8088"
    }
)



if isinstance(data.get("module", {}).get("features"), list) and len(data["module"]["features"]) == 0:
    data['module']['features'] = []
    data['module']['features'].append(
        sendRequest(
            data['module']['features'],
            f"/module/{data["module"]["data"]['version']["id"]}/feature",
            {
                "name" : "Python main cdn",
                "code" : "py_main_cnd_new"
            }
        )
    )
    data['module']['features'].append({
        sendRequest(
            f"/module/{data["module"]["data"]['version']["id"]}/feature",
            {
                "name" : "another feature",
                "code" : "another"
            }
        )
    })

if isinstance(data["project"].get("modules", []), list) and len(data["project"].get("modules", [])) == 0:
    data["project"]["modules"]=[]
    data["project"]["modules"].append(
        sendRequest(
            f"/project/{data["project"]["data"]["id"]}/versions/modules",
            {
                "module_version_ids": [data["module"]["version"]["id"]]
            }
        )
    )
if isinstance(data['project']['modules'][0].get('features', []), list) and len(data['project']['modules'][0].get('features', [])) == 0:
    data['project']['modules'][0]['features'] = []
    recentData = (
        sendRequest(
            f"/project/{data["project"]['data']["id"]}/versions/module/{data['project']['modules'][0]['data']['id']}/features",
            {
                "feature_ids":  [feature['data']["id"] for feature in data["module"]["features"]]
            }
        )
    )

    data["project"]['versions'] = [
        {
            'data': recentData['data']['project']['version']
        }
    ]
    data['project']['modules'][0]['features'].append(
        {
            "url": recentData["url"],
            "data": feature,
            "body": recentData["body"]
        } for feature in recentData['data']['project']['version']['snapshot_modules'][0]['snapshot_module_features']
    )


plan = ensure_dict(data, "plan")
checkAndUpdate(
    plan,
    '/plan',
    {
        "type" : "bundle",
        "billing_cycle" : "monthly",
        "price" : "1400",
        "name" : "all plans",
        "pause_days" : "+40",
        "allow_trial" : "True",
        "is_public" : "True"
    }
)

if isinstance(data['plan'].get('projects',[]), list) and len(data['plan'].get('projects',[])) == 0:
    data['plan']['projects']=[
        sendRequest(
            f"/plan/{data['plan']['data']['id']}/projects",
            {
                "project_version_ids": [data["project"]['versions']['data']['id']]
            }
        )
    ]

subscription = ensure_dict(data['organization'], "subscription")
checkAndUpdate(
     subscription,
    f"/subscription/{data['organization']['data']['id']}/plan/{data['plan']['data']['id']}",
    {
        "is_trial" : "False"
    }
)

payment = ensure_dict(data['organization']['subscription'], "payment")
checkAndUpdate(
    payment,
    f"/payment/{data['organization']['subscription']['data']['invoice']['id']}",
    {}
)















