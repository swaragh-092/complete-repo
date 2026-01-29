# Use the official Keycloak image
FROM quay.io/keycloak/keycloak:latest

# Set environment variables
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin123

# Set the database info (you can override using Render's environment settings)
ENV KC_DB=postgres
ENV KC_DB_URL=jdbc:postgresql://dpg-d1rra3be5dus73c4aje0-a:5432/keycloak_osu4
ENV KC_DB_USERNAME=keycloak
ENV KC_DB_PASSWORD=jxr0uz7EAo3JQDY5z5reWFLWWaiTK5Hf

# Expose port
EXPOSE 8080

# Run Keycloak in development mode (or remove --dev for production)
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
