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

        const id_inbox = await inbox();
        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Booking Buku",
            buttonUrl: "booking"
          })
        );
        if (id_inbox) await outbox(id_inbox, respon);
        if (id_inbox) await outbox(id_inbox, "booking");
      } else {
        const respon = result[1].respon.replace("$pesan", text);

        const id_inbox = await inbox();

        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Daftar Akun",
            buttonUrl: "daftar"
          })
        );

        if (id_inbox) await outbox(id_inbox, respon);
        if (id_inbox) await outbox(id_inbox, "daftar");
      }
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const gagal = async () => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'Default Fallback Intent'"
      );
      const id_inbox = await inbox();
      agent.add(result[0].respon);
      if (id_inbox) await outbox(id_inbox, result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const outbox = async (inbox_id, message) => {
    try {
      const [result, metadata] = await sequelize.query(
        `INSERT INTO tb_outbox (pesan_bot, id_inbox) VALUES ('${message}', ${inbox_id})`
      );

      if (metadata > 0) {
        await sequelize.query(
          `UPDATE tb_inbox SET tb_inbox.status = '1' WHERE tb_inbox.id_inbox = ${inbox_id}`
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const inbox = async (type = null) => {
    try {
      console.log(JSON.stringify(request.body));
      const message_id = type
        ? request.body.originalDetectIntentRequest.payload.callback_query
            .message.message_id
        : request.body.originalDetectIntentRequest.payload.message_id;
      const { queryText } = request.body.queryResult;
      const date = new Date();
      const id = type
        ? request.body.originalDetectIntentRequest.payload.callback_query.from
        : request.body.originalDetectIntentRequest.payload.from;
      const [result, metadata] = await sequelize.query(
        `INSERT INTO tb_inbox (id_pesan, pesan_user, tanggal, id_user, status) VALUES (${message_id}, '${queryText}', '${date.getFullYear()}-${date.getMonth() +
          1}-${date.getDate()}', ${id}, '0')`,
        { type: sequelize.QueryTypes.INSERT }
      );

      return metadata > 0 ? result : null;
    } catch (error) {
      console.log(error);
    }
  };

  const pinjam = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT * FROM tb_buku WHERE tb_buku.status = '0'"
      );
      const id_inbox = await inbox("button");
      result.map(async data => {
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
        );
        if (id_inbox) await outbox(id_inbox, data.id_buku);
      });
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
        const id_inbox = await inbox("button");
        agent.add(respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Menu booking",
            buttonUrl: "booking"
          })
        );

        if (id_inbox) await outbox(id_inbox, respon);
        if (id_inbox) await outbox(id_inbox, "booking");
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
      const id_inbox = await inbox("button");
      agent.add(result[0].respon);
      if (id_inbox) await outbox(id_inbox, result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const daftarnim = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.intent = 'daftar - user'"
      );
      const id_inbox = await inbox();
      agent.add(result[0].respon);
      if (id_inbox) await outbox(id_inbox, result[0].respon);
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
        const id_inbox = await inbox();
        agent.add(result[1].respon);
        agent.add(
          new Card({
            title: "LibraryBot",
            buttonText: "Booking Buku",
            buttonUrl: "booking"
          })
        );
        if (id_inbox) await outbox(id_inbox, result[1].respon);
        if (id_inbox) await outbox(id_inbox, "booking");
      } else {
        const id_inbox = await inbox();
        agent.add(result[2].respon);
        if (id_inbox) await outbox(id_inbox, result[2].respon);
      }
    } catch (error) {
      agent.add("Mohon maaf, tolong melakukan inputan kembali");
    }
  };

  const listBuku = async agent => {
    try {
      const {
        id
      } = request.body.originalDetectIntentRequest.payload.callback_query.from;
      const [result] = await sequelize.query(
        `SELECT tb_buku.kategori_buku, tb_buku.judul_buku, tb_buku.gambar_buku, tb_buku.deskripsi FROM tb_buku, tb_pinjam WHERE tb_pinjam.id_user = '${id}' AND tb_pinjam.id_buku = tb_buku.id_buku`
      );
      const id_inbox = await inbox("button");
      result.map(async data => {
        agent.add(
          new Card({
            title: data.kategori_buku,
            imageUrl: data.gambar_buku,
            text: `${data.judul_buku}\n\nDeskripsi Buku : ${data.deskripsi}`,
            buttonText: "Kembali",
            buttonUrl: "booking"
          })
        );
        if (id_inbox) await outbox(id_inbox, "booking");
      });
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
  intent.set("list buku", listBuku);
  intent.set("Default Fallback Intent", gagal);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
