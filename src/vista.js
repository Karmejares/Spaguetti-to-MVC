/**
 * VISTA · Notas del semestre                                             (PARTE 3 de la guía)
 *
 * SABE: dibujar el estado del Modelo en el DOM y avisar qué hizo el usuario (clics, formularios).
 * NO SABE: ninguna regla de negocio, ni cambiar el Modelo, ni guardar datos.
 *
 * Lee del Modelo (solo lectura) y se suscribe a sus cambios para redibujarse sola.
 * El HTML estático (formulario, tabla, resumen) ya está en index.html: aquí solo se rellena y se escucha.
 */
 
// Cómo se PRESENTA cada estado (texto y clase CSS). El estado lo decide el Modelo; la Vista solo lo traduce a pantalla.
const PRESENTACION_ESTADO = {
  'aprobado': { clase: 'ok', texto: () => '¡Aprobado! Ya aseguraste la nota mínima.' },
  'en-camino': { clase: 'en-camino', texto: (n) => `En camino: necesitas ${n} en lo que falta.` },
  'en-riesgo': { clase: 'riesgo', texto: (n) => `En riesgo: necesitas ${n} en lo que falta.` },
  'imposible': { clase: 'imposible', texto: () => 'Imposible aprobar con las notas actuales.' },
};
 
/** Formatea un porcentaje como en la versión espagueti: hasta 2 decimales, seguido de " %". */
const porcentaje = (n) => `${Math.round(n * 100) / 100} %`;
 
export class NotasVista {
  #modelo;
  #el;
 
  constructor(raiz, modelo) {
    this.#modelo = modelo;
 
    // 3A · Los elementos que la Vista usa (todos vienen de index.html).
    const buscar = (id) => raiz.querySelector(`#${id}`);
    this.#el = {
      form: buscar('form'),
      nombre: buscar('nombre'),
      peso: buscar('peso'),
      nota: buscar('nota'),
      error: buscar('error'),
      tabla: buscar('tabla'),
      vacio: buscar('vacio'),
      acumulado: buscar('acumulado'),
      pesoCalificado: buscar('pesoCalificado'),
      pesoPendiente: buscar('pesoPendiente'),
      necesaria: buscar('necesaria'),
      estado: buscar('estado'),
    };
 
    // Observer: cada vez que el Modelo cambie, la Vista se redibuja sola.
    this.#modelo.suscribir(() => this.render());
    this.render();
  }
 
  // ---------------------------------------------------------- 3B · Eventos que la Vista ofrece
  // El Controlador se registra aquí. La Vista no decide qué hacer: solo avisa "el usuario hizo esto".
 
  alAgregar(manejador) {
    this.#el.form.addEventListener('submit', (evento) => {
      evento.preventDefault(); // sin recargar la página
      manejador(this.leerFormulario());
    });
  }
 
  // EJEMPLO RESUELTO: un solo escuchador en la tabla sirve para todas las filas (delegación de eventos).
  alEliminar(manejador) {
    this.#el.tabla.addEventListener('click', (evento) => {
      const boton = evento.target.closest('button[data-eliminar]');
      if (boton) manejador(Number(boton.dataset.eliminar));
    });
  }
 
  alCalificar(manejador) {
    this.#el.tabla.addEventListener('change', (evento) => {
      const campo = evento.target.closest('input[data-nota]');
      if (campo) manejador(Number(campo.dataset.nota), campo.value);
    });
  }
 
  // ---------------------------------------------------------- 3C · Órdenes que la Vista obedece
 
  leerFormulario() {
    return {
      nombre: this.#el.nombre.value,
      peso: this.#el.peso.value,
      nota: this.#el.nota.value,
    };
  }
 
  limpiarFormulario() {
    this.#el.form.reset();
  }
 
  mostrarError(mensaje) {
    this.#el.error.textContent = mensaje;
  }
 
  limpiarError() {
    this.#el.error.textContent = '';
  }
 
  // ---------------------------------------------------------- 3D · Dibujar
 
  /** Dibuja TODO a partir del Modelo. No decide nada: solo presenta. */
  render() {
    const evaluaciones = this.#modelo.evaluaciones;
    const r = this.#modelo.resumen();
 
    // Tabla: una fila por evaluación, armada con createElement/textContent (nunca innerHTML con datos del usuario).
    this.#el.tabla.replaceChildren(...evaluaciones.map((e) => this.#fila(e)));
    this.#el.vacio.hidden = evaluaciones.length > 0;
 
    // Resumen
    this.#el.acumulado.textContent = r.acumulado.toFixed(2);
    this.#el.pesoCalificado.textContent = porcentaje(r.pesoCalificado);
    this.#el.pesoPendiente.textContent = porcentaje(r.pesoPendiente);
    const necesaria = r.notaNecesaria === null ? '—' : r.notaNecesaria.toFixed(2);
    this.#el.necesaria.textContent = necesaria;
 
    const { clase, texto } = PRESENTACION_ESTADO[r.estado];
    this.#el.estado.textContent = texto(necesaria);
    this.#el.estado.className = `estado ${clase}`;
  }
 
  /** Crea la fila <tr> de una evaluación. */
  #fila(e) {
    const tr = document.createElement('tr');
 
    const celda = (contenido) => {
      const td = document.createElement('td');
      if (typeof contenido === 'string') td.textContent = contenido;
      else td.append(contenido);
      tr.append(td);
    };
 
    const campoNota = document.createElement('input');
    campoNota.type = 'number';
    campoNota.step = 'any';
    campoNota.value = e.nota === null ? '' : String(e.nota);
    campoNota.dataset.nota = String(e.id);
    campoNota.setAttribute('aria-label', `Nota de ${e.nombre}`);
 
    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.dataset.eliminar = String(e.id);
 
    celda(e.nombre); // textContent: si escriben <b>hola</b>, se ve tal cual y no se interpreta
    celda(`${e.peso} %`);
    celda(campoNota);
    celda(e.nota === null ? '—' : ((e.peso * e.nota) / 100).toFixed(2));
    celda(botonEliminar);
 
    return tr;
  }
}
