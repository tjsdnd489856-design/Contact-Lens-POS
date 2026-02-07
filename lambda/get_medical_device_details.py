import json
import os
import requests
import boto3
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """
    AWS Lambda handler to fetch medical device details using a UDI-DI.
    - Fetches an API key from AWS Secrets Manager.
    - Calls an external API to get device details.
    - Handles CORS for requests from a specific origin.
    """
    # Configuration
    # IMPORTANT: Replace with your actual frontend origin (e.g., 'https://your-app.pages.dev')
    # For development, you can use '*' but it's not recommended for production.
    allowed_origin = os.environ.get('ALLOWED_ORIGIN', '*') 
    
    # CORS Preflight Request Handling
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': allowed_origin,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': ''
        }

    # Main Function Logic
    try:
        # 1. Parse UDI-DI from the request body
        body = json.loads(event.get('body', '{}'))
        udi_di = body.get('udiDi')

        if not udi_di:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': allowed_origin},
                'body': json.dumps({'error': 'The function must be called with a JSON body containing { udiDi: "your_code" }.'})
            }

        # 2. Fetch API key from AWS Secrets Manager
        # IMPORTANT: Create a secret in AWS Secrets Manager with this name
        secret_name = "prod/MedicalDeviceApiKey" 
        region_name = os.environ.get('AWS_REGION', 'us-east-1')

        session = boto3.session.Session()
        client = session.client(service_name='secretsmanager', region_name=region_name)

        try:
            get_secret_value_response = client.get_secret_value(SecretId=secret_name)
            secret = get_secret_value_response['SecretString']
            # Secrets Manager can store a JSON string, so we parse it.
            service_key = json.loads(secret)['MED_DEVICE_API_KEY']
        except ClientError as e:
            print(f"Error fetching secret: {e}")
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': allowed_origin},
                'body': json.dumps({'error': 'API key not configured on the server.'})
            }

        # 3. Call the external API
        api_url = "https://apis.data.go.kr/1471000/MdeqStdCdUnityInfoService01/getMdeqStdCdUnityInfoList"
        params = {
            'serviceKey': service_key,
            'type': 'json',
            'numOfRows': 1,
            'pageNo': 1,
            'diCd': udi_di,
        }
        
        api_response = requests.get(api_url, params=params)
        api_response.raise_for_status() # Raise an exception for bad status codes
        
        response_data = api_response.json()
        items = response_data.get('response', {}).get('body', {}).get('items', {}).get('item')

        # 4. Process the response and return
        if not items:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': allowed_origin},
                'body': json.dumps({
                    'productFound': False,
                    'message': 'No product details found for this UDI-DI.'
                })
            }
        
        product_info = items[0]
        extracted_details = {
            'productFound': True,
            'udiDi': product_info.get('diCd', udi_di),
            'productName': product_info.get('prdlstNm', 'N/A'),
            'brand': product_info.get('bsshNm', 'N/A'),
            'model': product_info.get('mdlNm', 'N/A'),
        }

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': allowed_origin},
            'body': json.dumps(extracted_details)
        }

    except requests.exceptions.RequestException as e:
        print(f"Error calling external API: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': allowed_origin},
            'body': json.dumps({'error': 'Failed to retrieve product details from external API.'})
        }
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': allowed_origin},
            'body': json.dumps({'error': f'An unexpected server error occurred: {str(e)}'})
        }
