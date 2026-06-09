SELECT 'CREATE DATABASE adotapet_user_auth'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'adotapet_user_auth')\gexec

SELECT 'CREATE DATABASE adotapet_catalog'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'adotapet_catalog')\gexec

SELECT 'CREATE DATABASE adotapet_adoption'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'adotapet_adoption')\gexec

SELECT 'CREATE DATABASE adotapet_chat'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'adotapet_chat')\gexec
