# Use a slim JDK runtime image
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy built JAR from local machine (built outside of this image)
COPY target/echospace-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080 8443

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
