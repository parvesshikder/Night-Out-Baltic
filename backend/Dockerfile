FROM golang:1.23-alpine AS build

WORKDIR /app
COPY go.mod ./
COPY *.go ./
RUN go build -o /night-out-api .

FROM alpine:3.20

WORKDIR /app
COPY --from=build /night-out-api /usr/local/bin/night-out-api
EXPOSE 8080
CMD ["night-out-api"]
