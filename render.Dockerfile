FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy pre-built JAR from repo root
COPY lumiroom-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
