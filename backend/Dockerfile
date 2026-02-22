# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN apk add --no-cache maven && \
    mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache dumb-init
COPY --from=build /app/target/*.jar app.jar

# Use production profile and bind to all interfaces (required for Render port detection)
ENV SPRING_PROFILES_ACTIVE=production
ENV SERVER_ADDRESS=0.0.0.0

# Render sets PORT (e.g. 10000); app uses server.port=${PORT:8080}
EXPOSE 8080
ENTRYPOINT ["dumb-init", "--", "java", "-jar", "app.jar"]
