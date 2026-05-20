const express = require('express');
const fs = require('fs'); 
const path = require('path');
const app = express();

// Portas dinâmicas e hosts configurados para a nuvem da Render
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

// AQUI ESTÁ A CORREÇÃO: Tira o Google e joga o lead para a sua Landing Page interna
const URL_DESTINO = '/index.html'; 

// Permite que o Express sirva os arquivos da pasta (como o index.html)
app.use(express.static(__dirname));

app.get(/.*/, async (req, res) => {
    try {
        const ipOriginal = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLimpo = ipOriginal.split(',')[0].trim();
        const horario = new Date().toLocaleString('pt-BR');
        
        // Mantém o filtro para ignorar os seus cliques de teste local
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

            // Grava os dados da isca no histórico silenciosamente
            const logTexto = `Data: ${horario} | IP: ${ipLimpo} | Rota: ${req.url} | Local: ${localizacaoStr} | Provedor: ${provedorStr}\n`;
            fs.appendFile('historico.txt', logTexto, (err) => {
                if (err) console.error('Erro ao salvar no arquivo de log:', err);
            });

            console.log(`\n🚨 [ALERTA DE ISCA] Novo lead capturado!`);
            console.log(`📡 IP: ${ipLimpo}`);
            console.log(`📍 Localização: ${localizacaoStr}`);
            console.log(`🏢 Provedor: ${provedorStr}`);
            console.log(`==================================================`);
        } else {
            console.log(`\n💻 [TESTE LOCAL] Redirecionamento executado para ambiente interno.`);
        }

        // Executa o redirecionamento original para a URL_DESTINO corrigida
        res.redirect(302, URL_DESTINO);

    } catch (error) {
        console.error('🔥 Erro na execução do roteador:', error);
        res.redirect(302, URL_DESTINO); 
    }
});

app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Roteador operando com sucesso!`);
});
