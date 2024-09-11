# Use the official PostgreSQL image
FROM postgres:latest

# Copy initialization script to the container
COPY init.sql /docker-entrypoint-initdb.d/

# Environment variables for PostgreSQL
ENV POSTGRES_USER=db_user
ENV POSTGRES_PASSWORD=db_password
ENV POSTGRES_DB=Godot

# Expose the PostgreSQL port
EXPOSE 5432
