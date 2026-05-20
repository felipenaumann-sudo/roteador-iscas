const express = require('express');
const fs = require('fs'); 
const path = require('path');
const app = express();

// Portas dinâmicas para a nuvem
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

// Habilita o Express a ler e entregar arquivos da pasta
app.use(express.static(__dirname));

app.get(/.*/, async (req, res) => {
    try {
        const ipOriginal = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLimpo = ipOriginal.split(',')[0].trim();
        const horario = new Date().toLocaleString('pt-BR');
        
        const ehLocalhost = ipLimpo === '::1' || ipLimpo === '127.0.0.1' || ipLimpo.startsWith('192.168.');

        if (!ehLocalhost) {
            let localizacaoStr = 'Não identificada';
            let provedorStr = 'N/A';

            try {
                const geoResponse = await fetch(`http://ip-api.com/json/${ipLimpo}`);
                const geoData = await geoResponse.json();
                if (geoData.status === 'success') {
                    localizacaoStr = `${geoData.city}, ${geoData.regionName} - ${geoData.country}`;
                    provedorStr = geoData.isp;
                }
            } catch (geoErr) {
                localizacaoStr = 'Erro na consulta de Geolocalização';
            }

            const logTexto = `Data: ${horario} | IP: ${ipLimpo} | Rota: ${req.url} | Local: ${localizacaoStr} | Provedor: ${provedorStr}\n`;
            fs.appendFile('historico.txt', logTexto, (err) => {
                if (err) console.error('Erro ao salvar no arquivo de log:', err);
            });

            console.log(`\n🚨 [ALERTA DE ISCA] Novo lead capturado!`);
            console.log(`📡 IP: ${ipLimpo}`);
            console.log(`📍 Localização: ${localizacaoStr}`);
            console.log(`🏢 Provedor: ${provedorStr}`);
            console.log(`==================================================`);
        }

        // BIOMBO DE REDIRECIONAMENTO: Entrega a sua Landing Page escura com o seu WhatsApp
        res.sendFile(path.join(__dirname, 'index.html'));

    } catch (error) {
        console.error('🔥 Erro na execução:', error);
        res.sendFile(path.join(__dirname, 'index.html')); 
    }
});

app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Roteador Fantasma Ativo!`);
});
