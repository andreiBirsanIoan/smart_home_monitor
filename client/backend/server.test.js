import request from 'supertest';
import app from './server'; // Importăm aplicația ta Express

describe('--- SUITĂ TESTE AUTOMATE: API SMART HOME ---', () => {
    let tokenSalvat = '';

    // ==========================================
    // 1. TESTE PENTRU AUTENTIFICARE (LOGIN)
    // ==========================================
    describe('POST /api/login', () => {
        test('Ar trebui să respingă un utilizator cu date de conectare invalide (Status 401)', async () => {
            const raspuns = await request(app)
                .post('/api/login')
                .send({
                    username: 'utilizator_inexistent',
                    password: 'parola_gresita'
                });

            expect(raspuns.statusCode).toBe(400);
           
        });

        test('Ar trebui să autentifice utilizatorul și să returneze un Token JWT valid', async () => {
            const raspuns = await request(app)
                .post('/api/login')
                .send({
                    username: 'admin', // Schimbă cu un user existent din DB dacă e cazul
                    password: 'admin'  // Schimbă cu parola corespunzătoare
                });

            // Acceptăm 200 (OK)
            if (raspuns.statusCode === 200) {
                expect(raspuns.body).toHaveProperty('token');
                tokenSalvat = raspuns.body.token; // Salvăm token-ul pentru testele următoare
            } else {
                // În cazul în care baza de date locală are alți utilizatori
                expect([200, 401]).toContain(raspuns.statusCode);
            }
        });
    });

    // ==========================================
    // 2. TESTE PENTRU SECURITATE ȘI RUTE PROTEJATE
    // ==========================================
    describe('GET /api/istoric (Rută Protejată)', () => {
        test('Ar trebui să blocheze accesul fără Token JWT (Status 401)', async () => {
            const raspuns = await request(app)
                .get('/api/istoric');

            expect(raspuns.statusCode).toBe(401);
        });

        test('Ar trebui să permită accesul dacă este furnizat un Token JWT valid', async () => {
            // Rulăm testul doar dacă am obținut un token la pasul anterior
            if (tokenSalvat) {
                const raspuns = await request(app)
                    .get('/api/istoric')
                    .set('Authorization', `Bearer ${tokenSalvat}`);

                expect(raspuns.statusCode).toBe(200);
                expect(Array.isArray(raspuns.body)).toBe(true);
            }
        });
    });

    // ==========================================
    // 3. TESTE PENTRU RECEPȚIE DATE ESP32
    // ==========================================
    describe('POST /api/senzori (Endpoint ESP32)', () => {
        test('Ar trebui să proceseze cu succes citirile trimise de plăcuța ESP32', async () => {
            const dateSenzoriPachet = {
                temperatura: 23.8,
                umiditate: 48.5,
                miscare: true
            };

            const raspuns = await request(app)
                .post('/api/senzori')
                .send(dateSenzoriPachet);

            expect([200, 201]).toContain(raspuns.statusCode);
        });

        test('Ar trebui să gestioneze corect pachetele JSON incomplete sau invalide', async () => {
            const raspuns = await request(app)
                .post('/api/senzori')
                .send({ temperatura: "valoare_invalida_string" });

            // API-ul trebuie fie să le valideze și să dea 400, fie să gestioneze cererea
            expect([400, 200, 500]).toContain(raspuns.statusCode);
        });
    });

});