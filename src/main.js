// RAÍZ DE COMPOSICIÓN: el único lugar que conoce las tres piezas y las conecta.

import { NotasModelo } from './modelo.js';
import { NotasVista } from './vista.js';
import { NotasControlador } from './controlador.js';
import { TermometroVista } from './termometro-vista.js';
import { AlmacenSesion } from './almacen.js';

// 1. El Modelo, con el almacén que elijamos (5C: sesión en vez de localStorage).
const modelo = new NotasModelo(new AlmacenSesion('notas.v1'));

// 2. La Vista: recibe el Modelo para poder LEERLO y suscribirse a sus cambios.
const vista = new NotasVista(document.getElementById('app'), modelo);

// 3. El Controlador: recibe las dos piezas y las conecta (eventos de la Vista → acciones del Modelo).
new NotasControlador(modelo, vista);

// 5B: segunda vista sobre el mismo Modelo.
new TermometroVista(document.getElementById('termometro'), modelo);