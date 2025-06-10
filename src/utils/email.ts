import nodemailer from 'nodemailer';

export const enviarCorreoVerificacion = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'multiuno51@gmail.com',
      pass: 'nzgy odob leuu uubv',
    },
  });

  const enlace = `http://localhost:3000/usuarios/verificar/${token}`;

  const mailOptions = {
    from: 'multiuno51@gmail.com',
    to: email,
    subject: 'Confirma tu cuenta',
    html: `<h2>Verifica tu cuenta</h2>
           <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
           <a href="${enlace}">Confirmar Cuenta</a>`,
  };

  await transporter.sendMail(mailOptions);
};



export const enviarCorreoReset = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'multiuno51@gmail.com',
      pass: 'nzgy odob leuu uubv'
    }
  });

  const url = `http://localhost:4200/usuarios/resetear-contrasenia/${token}`;
  const mailOptions = {
    from: 'multiuno51@gmail.com',
    to: email,
    subject: 'Restablece tu contraseña',
    html: `<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${url}">${url}</a>`
  };

  await transporter.sendMail(mailOptions);
};
