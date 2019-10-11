require("dotenv").config();
const express = require("express");
const Sequelize = require("sequelize");
const { WebhookClient, Card } = require("dialogflow-fulfillment");
const app = express();
const port = process.env.PORT;
const sequelize = new Sequelize("db_library", "dwikaputra15", "matahari54321", {
  host: "db4free.net",
  dialect: "mysql"
});
app.use(express.json());

app.post("/", (request, response, next) => {
  const agent = new WebhookClient({ request, response });
  let intent = new Map();

  const awalan = async agent => {
    try {
      const { text, from } = request.body.originalDetectIntentRequest.payload;

      const [user] = await sequelize.query(
        `SELECT * FROM tb_user WHERE tb_user.id_user = '${from.id}'`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'awal'"
      );

      if (user.length > 0) {
        let respon = result[0].respon.replace("$nama_user", user[0].nama_user);
        respon = respon.replace("$pesan", text);

        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Booking Buku",
            buttonUrl: "booking"
          })
        );
      } else {
        const respon = result[1].respon.replace("$pesan", text);
        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Daftar Akun",
            buttonUrl: "daftar"
          })
        );
      }
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };
  const pinjam = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT * FROM tb_buku WHERE tb_buku.status = '0'"
      );
      result.map(data =>
        agent.add(
          new Card({
            title: data.kategori_buku,
            imageUrl: data.gambar_buku,
            text: `${data.judul_buku}\n\nDeskripsi Buku : ${
              data.deskripsi
            }\n\nStatus Peminjaman: ${
              data.status === "0" ? "Belum Dipinjam" : "Sudah Dipinjam"
            }`,
            buttonText: "pinjam buku",
            buttonUrl: `${data.id_buku}`
          })
        )
      );
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const pinjambuku = async agent => {
    try {
      const {
        from,
        data
      } = request.body.originalDetectIntentRequest.payload.callback_query;

      const [insert, metadata] = await sequelize.query(
        `INSERT INTO tb_pinjam VALUES (NULL, '${new Date().getFullYear()}-${new Date().getMonth() +
          1}-${new Date().getDate()}', '${data}', '${from.id}')`
      );
      const [buku] = await sequelize.query(
        `SELECT * FROM tb_buku WHERE tb_buku.id_buku = '${data}'`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'Pinjam - Buku'"
      );

      if (metadata > 0) {
        const respon = result[0].respon.replace(
          "$judul_buku",
          buku[0].judul_buku
        );
        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Pinjam buku lagi",
            buttonUrl: "pinjam"
          })
        );
      } else {
        agent.add(result[0].respon);
      }
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali ");
    }
  };

  const daftar = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'daftar - nim'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const daftarnim = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'daftar - user'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const daftaruser = async agent => {
    try {
      const {
        nim,
        fakultas
      } = request.body.queryResult.outputContexts[0].parameters;
      const {
        id,
        first_name,
        last_name
      } = request.body.originalDetectIntentRequest.payload.from;

      const [insert, metadata] = await sequelize.query(
        `INSERT INTO tb_user VALUES ('${id}', '${first_name} ${last_name}', '${nim}', '${fakultas}')`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'daftar - user'"
      );
      if (metadata > 0) {
        agent.add(result[1].respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Booking Buku",
            buttonUrl: "booking"
          })
        );
      } else {
        agent.add(result[2].respon);
      }
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  intent.set("Awal", awalan);
  intent.set("daftar", daftar);
  intent.set("daftar - nim", daftarnim);
  intent.set("daftar - user", daftaruser);
  intent.set("Pinjam", pinjam);
  intent.set("Pinjam - Buku", pinjambuku);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
