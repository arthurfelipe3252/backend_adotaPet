/**
 * Tipos de usuário do sistema AdotaPet.
 * Espelha o enum `tipo_usuario` do PostgreSQL.
 *
 * - adotante: pessoa física que quer adotar um pet
 * - protetor: pessoa física que disponibiliza pets para adoção
 * - ong:      pessoa jurídica que disponibiliza pets para adoção
 */
export enum TipoUsuario {
  Adotante = 'adotante',
  Protetor = 'protetor',
  Ong = 'ong',
}
