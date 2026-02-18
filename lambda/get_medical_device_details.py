import json
import urllib.request
import urllib.parse
import boto3
from botocore.exceptions import ClientError

def get_secret():
    """AWS Secrets Manager에서 API 키를 가져옵니다."""
    secret_name = "prod/MedicalDeviceApiKey"
    region_name = "ap-southeast-2"

    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager', region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        return None

    secret = get_secret_value_response['SecretString']
    return json.loads(secret).get('MED_DEVICE_API_KEY')

def lambda_handler(event, context):
    # CORS 헤더 설정
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    }

    # 브라우저의 Preflight (OPTIONS) 요청 처리
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    try:
        # 요청 바디 파싱
        body = json.loads(event.get('body', '{}'))
        udi_di = body.get('udiDi')

        if not udi_di:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'udiDi parameter is missing'})
            }

        # API 키 가져오기
        api_key = get_secret()
        if not api_key:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Failed to retrieve API Key from Secrets Manager'})
            }

        # 공공데이터포털 의료기기 정보 조회 API 호출 (예시 URL, 실제 규격에 맞춰 조정 필요)
        # 여기서는 UDI-DI(GTIN)를 기반으로 제품명을 찾는 과정을 시뮬레이션하거나 실제 API 호출 로직을 넣습니다.
        # 실제 API: https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1
        
        base_url = "https://apis.data.go.kr/1471000/MddevPrdtInfoService1/getMddevPrdtItemInfo1"
        params = {
            'serviceKey': api_key,
            'pageNo': '1',
            'numOfRows': '1',
            'type': 'json',
            'UDI_DI': udi_di
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{base_url}?{query_string}"
        
        req = urllib.request.Request(full_url)
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            api_res = json.loads(res_data)

        # 응답 데이터 가공 (공공데이터포털 응답 규격에 따름)
        items = api_res.get('body', {}).get('items', [])
        
        if items:
            item = items[0]
            result = {
                'productFound': True,
                'brand': item.get('ENTP_NAME', 'N/A'),
                'model': item.get('PRDL_NM', 'N/A'),
                'productName': item.get('PRDT_NM', 'N/A'),
                'item_details': {
                    'brand': item.get('ENTP_NAME'),
                    'model': item.get('PRDL_NM'),
                    'productName': item.get('PRDT_NM')
                }
            }
        else:
            result = {
                'productFound': False,
                'message': 'API returned empty items list.'
            }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
