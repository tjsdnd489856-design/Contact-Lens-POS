import json
import urllib.request
import urllib.parse
import boto3

def lambda_handler(event, context):
    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    try:
        params = event.get("queryStringParameters") or {}
        udi = params.get("udiDi")
        if not udi:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "no udi"})}
        
        sm = boto3.client("secretsmanager", region_name="ap-southeast-2")
        res = sm.get_secret_value(SecretId="prod/MedicalDeviceApiKey")
        try:
            key = json.loads(res["SecretString"])["MED_DEVICE_API_KEY"]
        except:
            key = res["SecretString"]
            
        url = f"https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1?serviceKey={key}&pageNo=1&numOfRows=1&type=json&UDI_DI={udi}"
        
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode("utf-8"))
            
        items = data.get("body", {}).get("items", [])
        if items:
            i = items[0]
            body = {"brand": i.get("ENTP_NAME"), "model": i.get("PRDL_NM"), "productName": i.get("PRDT_NM")}
            return {"statusCode": 200, "headers": headers, "body": json.dumps(body)}
        
        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "not found"})}
    except Exception as e:
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": str(e)})}
