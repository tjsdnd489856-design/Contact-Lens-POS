import json
import urllib.request
import urllib.parse
import boto3

def lambda_handler(event, context):
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "application/json"
    }
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}
    try:
        query = event.get('queryStringParameters', {}) or {}
        udi = query.get('udiDi')
        if not udi:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'no udi'})}
        client = boto3.client('secretsmanager', region_name='ap-southeast-2')
        res = client.get_secret_value(SecretId="prod/MedicalDeviceApiKey")
        key = json.loads(res['SecretString']).get('MED_DEVICE_API_KEY')
        url = f"https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1?serviceKey={key}&pageNo=1&numOfRows=1&type=json&UDI_DI={udi}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
        items = data.get('body', {}).get('items', [])
        if items:
            item = items[0]
            result = {'brand': item.get('ENTP_NAME'), 'model': item.get('PRDL_NM'), 'productName': item.get('PRDT_NM')}
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps(result)}
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'not found'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': str(e)})}
