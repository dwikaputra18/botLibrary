require("dotenv").config();
const express = require("express");
const Sequelize = require("sequelize");
const { WebhookClient, Card } = require("dialogflow-fulfillment");
const app = express();
const port = process.env.PORT;
const sequelize = new Sequelize("db_library", "dwikaputra15", "Matahari54321", {
  host: "db4free.net",
  dialect: "mysql"
});
app.use(express.json());

app.post("/", (request, response, next) => {
  const agent = new WebhookClient({ request, response });
  let intent = new Map();

  const coliadi = agent => {
    agent.add("Made adi sedang coli");
  };

  const buku = async agent => {
    try {
      const [result] = await sequelize.query("SELECT * FROM tb_buku");
      result.map(data =>
        agent.add(
          new Card({
            title: data.judul_buku,
            imageUrl: data.gambar_buku,
            text: data.deskripsi,
            buttonText: "Booking",
            buttonUrl: `Booking`
          })
        )
      );
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  intent.set("coba", coliadi);
  intent.set("Pinjam", buku);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
