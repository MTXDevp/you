import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Función para iniciar el navegador y abrir la página
async function startBrowser() {
    const browser = await puppeteer.launch({ headless: false }); // Cambiar a true para modo sin cabeza
    const page = await browser.newPage();
    return { browser, page };
}

// Función para hacer clic en el botón "Aceptar todo"
async function clickAcceptButton(page) {
    await page.waitForSelector('button', { timeout: 10000 });

    const acceptButton = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button'))
            .find(button => button.textContent.includes('Aceptar todo'));
        return button ? button.outerHTML : null;
    });

    if (acceptButton) {
        console.log("Botón 'Aceptar todo' encontrado");
        await page.evaluate(() => {
            const button = Array.from(document.querySelectorAll('button'))
                .find(button => button.textContent.includes('Aceptar todo'));
            if (button) {
                button.click();
            }
        });
        console.log("Hiciste clic en el botón 'Aceptar todo'");
        
        // Esperar a que la navegación esté completa
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
    } else {
        console.log("No se encontró el botón 'Aceptar todo'");
    }
}

// Función para desplazarse al final de la página para cargar imágenes dinámicas
async function autoScroll(page) {
    await page.evaluate(async () => {
        let lastHeight = document.body.scrollHeight;
        const distance = 100; // Distancia a desplazar
        const delay = 200; // Retraso entre desplazamientos

        while (true) {
            // Desplazarse
            window.scrollBy(0, distance);
            console.log("Desplazándose...");
            await new Promise(resolve => setTimeout(resolve, delay)); // Esperar

            // Comprobar la nueva altura
            const newHeight = document.body.scrollHeight;
            console.log("Nueva altura:", newHeight);
            console.log("Última altura:", lastHeight);

            if (newHeight === lastHeight) {
                // Si no ha cambiado la altura, hemos llegado al final
                console.log("Final de la página alcanzado.");
                break;
            }
            lastHeight = newHeight;
        }
    });

    // Esperar un tiempo adicional para asegurarse de que los elementos se hayan cargado
    await page.waitForSelector('ytd-grid-video-renderer', { timeout: 30000 });
}

// Función para extraer URLs de imágenes
async function getImageUrls(page) {
    // Esperar a que el contenedor de los videos esté cargado
    await page.waitForSelector('ytd-grid-video-renderer', { timeout: 30000 });

    // Seleccionar todos los elementos <img> dentro de <yt-image>
    const imageElementsHTML = await page.$$eval('ytd-grid-video-renderer yt-image img', imgElements => {
        return imgElements.map(img => img.src); // Retorna la URL de cada imagen
    });

    // Imprimir los elementos <img>
    console.log("Elementos <img> encontrados:", imageElementsHTML);
    return imageElementsHTML; // Devolver las URLs
}

// Función principal que ejecuta todo el flujo de trabajo
async function main() {
    const { browser, page } = await startBrowser();

    const url = 'https://www.youtube.com/@SerEbroEnlosDeportes';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log("Página cargada");

    // Hacer clic en el botón de aceptar
    await clickAcceptButton(page);

    // Realiza desplazamiento para cargar imágenes dinámicas
    await autoScroll(page);

    // Extrae URLs de imágenes
    const imgUrls = await getImageUrls(page);
    console.log("Cantidad de imágenes encontradas:", imgUrls.length);

    await browser.close();
}

// Ejecutar el flujo de trabajo principal
main().catch(console.error);
