import os

import boto3


def get_s3_client():
    region = os.getenv("AWS_REGION")

    if region:
        return boto3.client("s3", region_name=region)

    return boto3.client("s3")


def get_bucket_name() -> str:
    bucket = os.getenv("S3_BUCKET")

    if not bucket:
        raise RuntimeError("S3_BUCKET environment variable is not configured")

    return bucket


def upload_document(
    file_bytes: bytes,
    s3_key: str,
    content_type: str,
) -> None:
    client = get_s3_client()

    client.put_object(
        Bucket=get_bucket_name(),
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )


def delete_document(s3_key: str) -> None:
    client = get_s3_client()

    client.delete_object(
        Bucket=get_bucket_name(),
        Key=s3_key,
    )