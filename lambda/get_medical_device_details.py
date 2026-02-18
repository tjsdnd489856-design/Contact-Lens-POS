import json
import urllib.request
import urllib.parse
import boto3

def get_secret():
    try:
        secret_name = "prod/MedicalDeviceApiKey"
        region_name = "ap-southeast-2"
        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=region_name)
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        return json.loads(get_secret_value_response['SecretString']).get('MED_DEVICE_API_KEY')
    except:
        return None

def lambda_handler(event, context):
    # CORS 헤더 (모든 요청 허용)
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
    }

    # 브라우저 사전 점검 대응
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        # GET 또는 POST에서 udiDi 파라미터 추출
        query_params = event.get('queryStringParameters', {})
        udi_di = query_params.get('udiDi')
        
        if not udi_di and event.get('body'):
            try:
                body = json.loads(event.get('body'))
                udi_di = body.get('udiDi')
            except:
                pass

        if not udi_di:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'No GTIN'})}

        api_key = get_secret()
        if not api_key:
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'API Key Error'})}

        # 공공데이터포털 API 호출
        base_url = "https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1"
        params = {
            'serviceKey': api_key,
            'pageNo': '1',
            'numOfRows': '1',
            'type': 'json',
            'UDI_DI': udi_di
        }
        
        full_url = f"{base_url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(full_url)
        
        with urllib.request.urlopen(req, timeout=5) as response:
            api_res = json.loads(response.read().decode('utf-8'))

        items = api_res.get('body', {}).get('items', [])
        if items:
            item = items[0]
            result = {
                'brand': item.get('ENTP_NAME', 'N/A'),
                'model': item.get('PRDL_NM', 'N/A'),
                'productName': item.get('PRDT_NM', 'N/A')
            }
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}
        
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not Found'})}

    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
