const { exec } = require('child_process');
const fs = require('fs');

const CERTIFICATE_FILE = 'server.crt';
const PRIVATE_KEY_FILE = 'privatekey.pem';
const RENEWAL_DAYS = 365;

if (!fs.existsSync(PRIVATE_KEY_FILE)) {
  console.error(`Private key file '${PRIVATE_KEY_FILE}' not found.`);
  process.exit(1);
}

exec(
  `openssl req -new -key ${PRIVATE_KEY_FILE} -out server.csr -subj "/C=AU/ST=Some-State/O=Internet Widgits Pty Ltd/CN=localhost" && openssl x509 -req -days ${RENEWAL_DAYS} -in server.csr -signkey ${PRIVATE_KEY_FILE} -out ${CERTIFICATE_FILE}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error renewing certificate: ${stderr}`);
      process.exit(1);
    }
    console.log(`Certificate renewed for ${RENEWAL_DAYS} days:\n${stdout}`);
  }
);
