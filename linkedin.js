const express = require('express');
const fs = require('fs'); 
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// SISTEMA DE MEMÓRIA TEMPORÁRIA: Evita duplicar logs se o mesmo IP clicar várias vezes seguidas
const ultimosAcessos = new Map();

app.use(express.static(__dirname));

app.get(/.*/, async (req, res) => {
    try {
        const ipOriginal = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLimpo = ipOriginal.split(',')[0].trim();
        const horario = new Date().toLocaleString('pt-BR');
        
        // NOVIDADE: Identifica o dispositivo (iPhone, Android, Windows, Mac)
        const userAgent = req.headers['user-agent'] || '';
        let dispositivo = 'PC / Notebook';
        if (userAgent.includes('iPhone')) dispositivo = 'iPhone';
        else if (userAgent.includes('iPad')) dispositivo = 'iPad';
        else if (userAgent.includes('Android')) dispositivo = 'Smartphone Android';

        const ehLocalhost = ipLimpo === '::1' || ipLimpo === '127.0.0.1' || ipLimpo.startsWith('192.168.');

        if (!ehLocalhost) {
            const agora = Date.now();
            const ultimoClique = ultimosAcessos.get(ipLimpo) || 0;

            // Só grava no histórico se tiver passado mais de 5 minutos desde o último clique do mesmo IP
            if (agora - ultimoClique > 5 * 60 * 1000) {
                ultimosAcessos.set(ipLimpo, agora);

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

                // Salva no arquivo incluindo a nova métrica de dispositivo
                const logTexto = `Data: ${horario} | IP: ${ipLimpo} | Disp: ${dispositivo} | Local: ${localizacaoStr} | Provedor: ${provedorStr}\n`;
                fs.appendFile('historico.txt', logTexto, (err) => {
                    if (err) console.error('Erro ao salvar no arquivo de log:', err);
                });

                // Alerta visual completo no terminal da Render
                console.log(`\n🚨 [ALERTA DE ISCA] Novo lead capturado!`);
                console.log(`📡 IP: ${ipLimpo}`);
                console.log(`📱 Dispositivo: ${dispositivo}`);
                console.log(`📍 Localização: ${localizacaoStr}`);
                console.log(`🏢 Provedor: ${provedorStr}`);
                console.log(`==================================================`);
            }
        } else {
            console.log(`\n💻 [TESTE LOCAL] Redirecionamento executado para ambiente interno.`);
        }

        res.sendFile(path.join(__dirname, 'index.html'));

    } catch (error) {
        console.error('🔥 Erro na execução do roteador:', error);
        res.sendFile(path.join(__dirname, 'index.html')); 
    }
});

app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Roteador operando com sucesso em http://${HOST}:${PORT}\n`);
});
