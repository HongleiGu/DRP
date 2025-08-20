# Runtime image for Java 21
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the pre-built Spring Boot JAR from backend/lumiroom/target
COPY backend/lumiroom/target/lumiroom-0.0.1-SNAPSHOT.jar app.jar

# Expose port Spring Boot listens on
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
