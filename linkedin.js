const express = require('express');
const fs = require('fs'); 
const path = require('path'); // Módulo nativo necessário para gerenciar os caminhos dos arquivos
const app = express();

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Permite conexões externas na nuvem

// MAPEAMENTO ESTRATÉGICO: Diz ao Express para servir a sua Landing Page escura (index.html)
app.use(express.static(__dirname));

app.get(/.*/, async (req, res) => {
    try {
        const ipOriginal = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipLimpo = ipOriginal.split(',')[0].trim();
        const horario = new Date().toLocaleString('pt-BR');
        
        // Verifica se o acesso é local (seu próprio teste)
        const ehLocalhost = ipLimpo === '::1' || ipLimpo === '127.0.0.1' || ipLimpo.startsWith('192.168.');

        if (!ehLocalhost) {
            // Esse bloco só executa se for um IP externo real (a isca)
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

            // Grava apenas dados de leads externos no arquivo historico.txt
            const logTexto = `Data: ${horario} | IP: ${ipLimpo} | Rota: ${req.url} | Local: ${localizacaoStr} | Provedor: ${provedorStr}\n`;
            fs.appendFile('historico.txt', logTexto, (err) => {
                if (err) console.error('Erro ao salvar no arquivo de log:', err);
            });

            // Exibe o alerta no terminal de Logs da Render ou VS Code
            console.log(`\n🚨 [ALERTA DE ISCA] Novo lead capturado!`);
            console.log(`📡 IP: ${ipLimpo}`);
            console.log(`📍 Localização: ${localizacaoStr}`);
            console.log(`🏢 Provedor: ${provedorStr}`);
            console.log(`==================================================`);
        } else {
            // Apenas exibe no terminal local para validação interna
            console.log(`\n💻 [TESTE LOCAL] Redirecionamento executado para ambiente interno.`);
        }

        // A CORREÇÃO: Em vez de redirecionar para uma URL externa ou para si mesmo,
        // o servidor entrega fisicamente o arquivo index.html salvo na mesma pasta.
        res.sendFile(path.join(__dirname, 'index.html'));

    } catch (error) {
        console.error('🔥 Erro na execução do roteador:', error);
        res.sendFile(path.join(__dirname, 'index.html')); 
    }
});

app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Roteador operando com sucesso em http://${HOST}:${PORT}`);
    console.log(`Aguardando acessos externos das iscas...\n`);
});
