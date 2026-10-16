/**
 * MODELO · Notas del semestre                                            (PARTE 2 de la guía)
 *
 * SABE: qué es una evaluación, las reglas (pesos, rangos, nota mínima) y cómo se calcula el resumen.
 * NO SABE: que existe una pantalla, el DOM, localStorage, alert()... Por eso se prueba sin navegador.
 *
 * Se comunica con el resto SIN conocerlo: avisa de sus cambios con el patrón Observer (suscribir).
 */

export const NOTA_MINIMA = 3.0; // para aprobar
export const NOTA_MAXIMA = 5.0;
export const UMBRAL_RIESGO = 4.0; // si necesitas más que esto en lo que falta, estás "en riesgo"
export const MAX_NOMBRE = 40;
export const PESO_MIN = 1;
export const PESO_MAX = 100; // también es el tope de la suma de pesos

const EPS = 1e-9; // tolerancia para comparar decimales (0.1 + 0.2 no es exactamente 0.3 en un computador)

/** Error de negocio: su mensaje se puede mostrar tal cual al usuario. */
export class ErrorDeReglas extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorDeReglas";
  }
}

/** Ayuda ya escrita: redondea hacia ARRIBA (la nota que "necesitas" nunca debe quedarse corta). */
const redondearArriba = (valor, decimales = 2) => {
  const f = 10 ** decimales;
  return Math.ceil(valor * f - EPS) / f;
};

export class NotasModelo {
  #almacen;
  #evaluaciones;
  #siguienteId;
  #suscriptores = new Set();

  // Ya escrito: recibe el almacén (no sabe cuál es), carga lo guardado y calcula el próximo id.
  constructor(almacen) {
    this.#almacen = almacen;
    this.#evaluaciones = almacen.cargar();
    this.#siguienteId =
      this.#evaluaciones.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }

  // Ya escrito: devuelve COPIAS, para que nadie cambie el estado interno saltándose las reglas.
  get evaluaciones() {
    return this.#evaluaciones.map((e) => ({ ...e }));
  }

  // ---------------------------------------------------------------- 2A · Agregar y validar
  agregar({ nombre, peso, nota = null }) {
    // R1 y R2 · nombre
    const nombreLimpio = String(nombre ?? "").trim();
    if (nombreLimpio === "")
      throw new ErrorDeReglas("El nombre es obligatorio.");
    if (nombreLimpio.length > MAX_NOMBRE)
      throw new ErrorDeReglas("El nombre no puede superar 40 caracteres.");
    // 5A · nombre único (sin importar mayúsculas ni espacios de los extremos)
    const clave = nombreLimpio.toLowerCase();
    if (this.#evaluaciones.some((e) => e.nombre.trim().toLowerCase() === clave))
      throw new ErrorDeReglas("Ya existe una evaluación con ese nombre.");

    // R3 · peso
    const pesoNum = typeof peso === "number" ? peso : parseFloat(peso);
    if (Number.isNaN(pesoNum) || pesoNum < PESO_MIN || pesoNum > PESO_MAX)
      throw new ErrorDeReglas("El peso debe estar entre 1 y 100.");

    // R4 · nota (opcional: null, undefined o "" significan "sin nota")
    let notaNum = null;
    if (nota !== null && nota !== undefined && nota !== "") {
      notaNum = typeof nota === "number" ? nota : parseFloat(nota);
      if (Number.isNaN(notaNum) || notaNum < 0 || notaNum > NOTA_MAXIMA)
        throw new ErrorDeReglas("La nota debe estar entre 0 y 5.");
    }

    // R5 · suma de pesos
    const total = this.#evaluaciones.reduce((suma, e) => suma + e.peso, 0);
    if (total + pesoNum > PESO_MAX + EPS) {
      const quedan = Math.round((PESO_MAX - total) * 100) / 100;
      throw new ErrorDeReglas(
        `Los pesos no pueden sumar más de 100 % (te quedan ${quedan} %).`,
      );
    }

    this.#evaluaciones.push({
      id: this.#siguienteId++,
      nombre: nombreLimpio,
      peso: pesoNum,
      nota: notaNum,
    });
    this.#cambio();
  }

  // ---------------------------------------------------------------- 2B · Calificar y eliminar
  calificar(id, nota) {
    // R6 · el id debe existir
    const evaluacion = this.#evaluaciones.find((e) => e.id === id);
    if (!evaluacion) throw new ErrorDeReglas("No existe la evaluación.");

    // R4 · null / undefined / "" quitan la nota; si no, debe estar entre 0 y 5
    let notaNum = null;
    if (nota !== null && nota !== undefined && nota !== "") {
      notaNum = typeof nota === "number" ? nota : parseFloat(nota);
      if (Number.isNaN(notaNum) || notaNum < 0 || notaNum > NOTA_MAXIMA)
        throw new ErrorDeReglas("La nota debe estar entre 0 y 5.");
    }

    evaluacion.nota = notaNum;
    this.#cambio();
  }

  eliminar(id) {
    const indice = this.#evaluaciones.findIndex((e) => e.id === id);
    if (indice === -1) throw new ErrorDeReglas("No existe la evaluación.");

    this.#evaluaciones.splice(indice, 1);
    this.#cambio();
  }

  // ---------------------------------------------------------------- 2C · Resumen
  resumen() {
    let acumulado = 0;
    let pesoCalificado = 0;
    for (const e of this.#evaluaciones) {
      if (e.nota !== null) {
        acumulado += (e.peso * e.nota) / 100;
        pesoCalificado += e.peso;
      }
    }

    const pesoPendiente = PESO_MAX - pesoCalificado;

    // Nota que necesitas promediar en lo que falta (null si no queda nada por calificar)
    let notaNecesaria = null;
    if (pesoPendiente > EPS) {
      notaNecesaria = redondearArriba(
        Math.max(0, (NOTA_MINIMA - acumulado) / (pesoPendiente / 100)),
      );
    }

    let estado;
    if (acumulado + EPS >= NOTA_MINIMA) estado = "aprobado";
    else if (notaNecesaria === null || notaNecesaria > NOTA_MAXIMA)
      estado = "imposible";
    else if (notaNecesaria > UMBRAL_RIESGO) estado = "en-riesgo";
    else estado = "en-camino";

    return { acumulado, pesoCalificado, pesoPendiente, notaNecesaria, estado };
  }

  // ---------------------------------------------------------------- 2D · Observer y persistencia
  suscribir(suscriptor) {
    this.#suscriptores.add(suscriptor);
    return () => {
      this.#suscriptores.delete(suscriptor);
    };
  }

  #cambio() {
    this.#almacen.guardar(this.evaluaciones);
    for (const suscriptor of [...this.#suscriptores]) suscriptor();
  }
}
