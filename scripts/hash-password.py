#!/usr/bin/env python3
"""Generate a scrypt salt:hash for the management login environment variables."""

import getpass
import hashlib
import os


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac(
        "sha512",
        password.encode("utf-8"),
        salt,
        100000,
        dklen=32,
    )
    return f"{salt.hex()}:{derived.hex()}"


def main():
    password = getpass.getpass("Enter password: ")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        print("Passwords do not match.")
        return 1
    if not password:
        print("Password cannot be empty.")
        return 1

    print(hash_password(password))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
