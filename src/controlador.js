/**
 * CONTROLADOR · Notas del semestre (PARTE 4 de la guía)
 *
 * SABE: traducir lo que hace el usuario (eventos de la Vista) en órdenes para el Modelo,
 * y qué mostrar cuando el Modelo rechaza una orden.
 * NO SABE: HTML ni DOM (eso es de la Vista), ni las reglas del negocio (eso es del Modelo).
 *
 * Es "delgado": cada método hace tres cosas como máximo (leer → ordenar → reaccionar).
 */
import { ErrorDeReglas } from './modelo.js';

export class NotasControlador {
  #modelo;
  #vista;

  constructor(modelo, vista) {
    this.#modelo = modelo;
    this.#vista = vista;

    // 4A: registrarse en la Vista
    vista.alAgregar(() => this.#agregar());
    vista.alEliminar((id) => this.#intentar(() => this.#modelo.eliminar(id)));
    vista.alCalificar((id, texto) =>
      this.#intentar(() => this.#modelo.calificar(id, this.#aNota(texto)))
    );
  }

  // leer → ordenar → reaccionar
  #agregar() {
    const { nombre, peso, nota } = this.#vista.leerFormulario();
    const salioBien = this.#intentar(() =>
      this.#modelo.agregar({
        nombre,
        peso: Number(peso),
        nota: this.#aNota(nota),
      })
    );
    if (salioBien) this.#vista.limpiarFormulario(); // si falló, conserva lo escrito
  }

  // La Vista entrega texto; el Modelo espera número o null.
  #aNota(texto) {
    const t = String(texto ?? '').trim();
    return t === '' ? null : Number(t);
  }

  // 4B: ejecuta una orden; devuelve true si salió bien
  #intentar(orden) {
    try {
      orden();
      this.#vista.limpiarError();
      return true;
    } catch (e) {
      if (e instanceof ErrorDeReglas) {
        this.#vista.mostrarError(e.message);
        this.#vista.render(); // deshace en pantalla lo que el Modelo no aceptó
        return false;
      }
      throw e; // los errores que no son de reglas no se esconden
    }
  }
}