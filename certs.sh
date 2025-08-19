# generate keystore
mkcert -pkcs12 keystore.p12 127.0.0.1 localhost 10.0.2.2 "*.sslip.io" 198.18.0.2

# Extract private key
openssl pkcs12 -in keystore.p12 -nocerts -nodes -out private-key.pem

# Extract certificate
openssl pkcs12 -in keystore.p12 -nokeys -out certificate.pem

# change password and alias
openssl pkcs12 -export -in certificate.pem -inkey private-key.pem -out keystore.p12 -name echospace -passout pass:echospace    