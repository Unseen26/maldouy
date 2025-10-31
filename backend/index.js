require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Endpoint 1: Iniciar Verificación (Solicitar Código)
app.post('/api/iniciar-verificacion', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).send({ success: false, error: 'El número de teléfono es requerido.' });
    }

    try {
        const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: phoneNumber, channel: 'whatsapp' });

        res.status(200).send({ success: true, status: verification.status });
    } catch (error) {
        console.error('Error al iniciar la verificación:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// Endpoint 2: Comprobar Verificación (Validar Código)
app.post('/api/comprobar-verificacion', async (req, res) => {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
        return res.status(400).send({ success: false, error: 'El número de teléfono y el código son requeridos.' });
    }

    try {
        const verification_check = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: phoneNumber, code: code });

        if (verification_check.status === 'approved') {
            res.status(200).send({ success: true, approved: true });
        } else {
            res.status(401).send({ success: false, approved: false, message: 'Código incorrecto o no válido.' });
        }
    } catch (error) {
        console.error('Error al comprobar la verificación:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});