import "dotenv/config";
import { createInterface } from "readline";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Corre esto en TU terminal local. La contrasena nunca sale de tu maquina —
// no se imprime en pantalla mientras la escribes y no pasa por ningun chat.
//   npx tsx scripts/set-admin-password.ts

const CTRL_C = "";
const BACKSPACE = "";

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode?.(true);
    stdin.setEncoding("utf8");

    let input = "";
    const onData = (char: string) => {
      if (char === "\n" || char === "\r") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === CTRL_C) {
        stdin.setRawMode?.(false);
        process.exit(1);
      }
      if (char === BACKSPACE || char === "\b") {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = (await ask("Email del admin a actualizar [admin@ferrenewlink.com]: ")) || "admin@ferrenewlink.com";

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    console.error(`No existe ninguna cuenta con el correo "${email}".`);
    process.exit(1);
  }
  if (!customer.isAdmin) {
    console.error(`"${email}" existe pero no es una cuenta admin (isAdmin=false). Abortado.`);
    process.exit(1);
  }

  const password = await askHidden("Nueva contrasena (min. 8 caracteres, no se muestra en pantalla): ");
  if (password.length < 8) {
    console.error("La contrasena debe tener al menos 8 caracteres. No se cambio nada.");
    process.exit(1);
  }
  const confirm = await askHidden("Confirma la nueva contrasena: ");
  if (password !== confirm) {
    console.error("Las contrasenas no coinciden. No se cambio nada.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.customer.update({ where: { email }, data: { passwordHash } });

  console.log(`Listo. La contrasena de "${email}" fue actualizada.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
