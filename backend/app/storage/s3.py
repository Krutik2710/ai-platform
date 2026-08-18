import os

import boto3


S3_BUCKET = os.environ["S3_BUCKET"]
AWS_REGION = os.getenv("AWS_REGION")


def get_s3_client():
    if AWS_REGION:
        return boto3.client("s3", region_name=AWS_REGION)

    return boto3.client("s3")


def upload_document(
    file_bytes: bytes,
    s3_key: str,
    content_type: str,
) -> None:
    client = get_s3_client()

    client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )


def delete_document(s3_key: str) -> None:
    client = get_s3_client()

    client.delete_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
    )
