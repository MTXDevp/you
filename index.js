import puppeteer from 'puppeteer';  
import fetch from 'node-fetch'; 
import * as cheerio from 'cheerio'; 
import fs from 'fs';


const url = 'https://www.youtube.com/@SerEbroEnlosDeportes';

async function youRequest() {
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            const html = await response.text();

            fs.writeFileSync('testr.html', html, 'utf-8');

            const $ = cheerio.load(html);
            const titulos = [];

            $('script').each((index, element) => {
                const scriptContent = $(element).html();
                const match = scriptContent.match(/"label":"(.*?)"/g);

                if (match) {
                    match.forEach(item => {
                        const title = item.split('"label":"')[1].replace('"', ''); 
                        titulos.push(title);
                    });
                }
            });

            if (titulos.length > 0) {
                console.log('Títulos de videos encontrados:');
                titulos.forEach(titulo => console.log(titulo));
            } else {
                console.log('No se encontraron títulos de videos.');
            }
        } else {
            console.error(`Error al realizar la solicitud: ${response.status}`);
        }
    } catch (error) {
        console.error('Error al obtener los títulos:', error.message);
    }
}


async function youScrapV2() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const url = 'https://www.youtube.com/@SerEbroEnlosDeportes';
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log("Page loaded");

    await page.waitForSelector('button');

    const acceptButton = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
            .find(button => button.textContent.includes('Aceptar todo'));
        return button ? button.outerHTML : null; 
    });

    if (acceptButton) {
        console.log("acceptButton found");
        await page.evaluate(() => {
            const button = Array.from(document.querySelectorAll('button'))
                .find(button => button.textContent.includes('Aceptar todo'));
            if (button) {
                button.click();
            }
        });
        console.log("Clicked on accept button");
        await getTitulos(page);
    } else {
        console.log("No se encontró el botón 'Aceptar todo'");
    }
}


async function getTitulos(page) {

    try {
  
    await page.waitForSelector('#video-title', { timeout: 10000 });

    const videoTitles = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('#video-title');
        const titles = [];

        console.log("videoElements found:", videoElements.length);

        videoElements.forEach((video) => {
            console.log("Extracting title:", video.textContent.trim());
            titles.push(video.textContent.trim());
        });
        return titles;
    });

    console.log(videoTitles);

    await browser.close();
    console.log("Navegador cerrado.");

} catch (error) {
    console.error("Error durante el scraping:", error);
  }
}

youScrapV2().catch(error => console.error('Error:', error));