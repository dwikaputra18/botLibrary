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

  const pinjam = async agent => {
    try {
      const [result] = await sequelize.query("SELECT * FROM tb_buku");
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
            buttonText: "pinjam",
            buttonUrl: `pinjam`
          })
        )
      );
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const daftarnama = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = `daftar - nama`"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, silahkan untuk menginputkan kembali");
    }
  };

  const daftarnim = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = `daftar - NIM`"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, silahkan untuk menginputkan kembali");
    }
  };

  const daftaruser = async agent => {
    try {
      console.log(JSON.stringify(request.body));
      agent.add("Mohon cek log nya");
    } catch (error) {
      agent.add("Mohon maaf, silahkan untuk menginputkan kembali");
    }
  };

  intent.set("Pinjam", pinjam);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
