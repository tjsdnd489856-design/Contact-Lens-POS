import json
import urllib.request
import urllib.parse
import boto3

def lambda_handler(event, context):
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Content-Type": "application/json"
    }

    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        params = event.get('queryStringParameters', {}) or {}
        udi_di = params.get('udiDi')
        
        if not udi_di:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'No GTIN'})}

        client = boto3.client('secretsmanager', region_name='ap-southeast-2')
        res = client.get_secret_value(SecretId="prod/MedicalDeviceApiKey")
        api_key = json.loads(res['SecretString']).get('MED_DEVICE_API_KEY')

        url = f"https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1?serviceKey={api_key}&pageNo=1&numOfRows=1&type=json&UDI_DI={udi_di}"
        
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))

        items = data.get('body', {}).get('items', [])
        if items:
            item = items[0]
            result = {
                'brand': item.get('ENTP_NAME', 'N/A'),
                'model': item.get('PRDL_NM', 'N/A'),
                'productName': item.get('PRDT_NM', 'N/A')
            }
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(result)}
        
        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Not Found'})}

    except Exception as e:
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
