const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
const app = express();
const fetch = require("node-fetch");
var i;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Need to be modulirized later
 * Sigining and forwarding transaction
 */

const API_URL = "http://localhost:8008";

const { createContext, CryptoFactory } = require("sawtooth-sdk/signing");
const { createHash } = require("crypto");
const crypto = require("crypto");
const { protobuf } = require("sawtooth-sdk");
const axios = require("axios").default;
const { json } = require("body-parser");

const context = createContext("secp256k1");
const privateKey = context.newRandomPrivateKey();
const signer = new CryptoFactory(context).newSigner(privateKey);

const _hash = (x) =>
  crypto.createHash("sha512").update(x).digest("hex").toLowerCase();

const TP_FAMILY = "battleship";
const TP_NAMESPACE = _hash(TP_FAMILY).substr(0, 6);
const TP_VERSION = "1.1";

app.get("/get_all_info", async (req, res) => {
  axios
    .get(`${API_URL}/transactions`)
    .then((response) => {
      return response.data.data;
    })
    .then((data) => {
      
      let resPayloads = [];
      data.forEach((element) => {
        if (
          element != data[data.length - 1] &&
          element != data[data.length - 2] &&  // Estes 3 sao defualt
          element != data[data.length - 3]
        ) {
          let payload = element.payload;

          let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
          
          decodedPayload = JSON.parse(decodedPayload);
          resPayloads.push(decodedPayload);
        }
      });

      console.log(
        "--------------------------- PAYLOADS ARRAY --------------------------\n" +
          JSON.stringify(resPayloads) +
        "\n---------------------------------------------------------------------\n"
      );
      // res.contentType("application/json");
      // res.send(JSON.parse("[" + resPayloads + "]"));
      res.send(resPayloads);
    })
    .catch((error) => {
      console.log(error);
    });
});

/***********************************************************************/

/*Projetos*/
app.get("/getProjetos", async (req, res) => {
  axios
    .get(`${API_URL}/transactions`)
    .then((response) => {
      return response.data.data;
    })
    .then((data) => {
      
      let resPayloads = [];
      data.forEach((element) => {
        if (
          element != data[data.length - 1] &&
          element != data[data.length - 2] && 
          element != data[data.length - 3]
        ) {
          let payload = element.payload;

          let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
          console.log(
            decodedPayload +
              "\n---------------------------------------------------------------------"
          );

          decodedPayload = JSON.parse(decodedPayload);

          if (
            decodedPayload.categoria === "projeto"
          ) {
            resPayloads.push(decodedPayload);
          }
        }
      });

      console.log(
        "--------------------------- PAYLOADS ARRAY --------------------------\n" +
          JSON.stringify(resPayloads) +
        "\n---------------------------------------------------------------------\n"
      );
      // res.contentType("application/json");
      // res.send(JSON.parse("[" + resPayloads + "]"));
      res.send(resPayloads);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.post("/insertProjeto", async (req, res) => {
  let address = TP_NAMESPACE + _hash("sampleKey").substr(0, 64);
  const payload = req.body;

  // Input for one transaction
  const payloadBytes = Buffer.from(JSON.stringify(payload));

  // Output we created with this transaction input

  const transactionHeaderBytes = protobuf.TransactionHeader.encode({
    familyName: TP_FAMILY,
    familyVersion: TP_VERSION,
    // Needs to be same as the expected address we create in contract
    // If diffrent we wont get access to put state and get state of the address
    inputs: [address],
    outputs: [address],
    signerPublicKey: signer.getPublicKey().asHex(),
    batcherPublicKey: signer.getPublicKey().asHex(),
    dependencies: [],
    payloadSha512: createHash("sha512").update(payloadBytes).digest("hex"),
  }).finish();

  const signature = signer.sign(transactionHeaderBytes);

  // Sign the transaction
  const transaction = protobuf.Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: payloadBytes,
  });

  // Wrap it into list of transaction
  const transactions = [transaction];

  const batchHeaderBytes = protobuf.BatchHeader.encode({
    signerPublicKey: signer.getPublicKey().asHex(),
    transactionIds: transactions.map((txn) => txn.headerSignature),
  }).finish();

  // Wrap the transaction list into batch
  const batchSignature = signer.sign(batchHeaderBytes);

  // And sign it
  const batch = protobuf.Batch.create({
    header: batchHeaderBytes,
    headerSignature: batchSignature,
    transactions: transactions,
  });

  // Wrap them in batch list
  const batchListBytes = protobuf.BatchList.encode({
    batches: [batch],
  }).finish();
  axios
    .post(`${API_URL}/batches`, batchListBytes, {
      headers: { "Content-Type": "application/octet-stream" },
    })
    .then((response) => {
      console.log({
        address,
        TP_NAMESPACE,
      });
      console.log(response.dadosdata);

      res.send({
        message: "submitted",
        data: response.data,
      });
    })
    .catch((error) => {
      console.error(error);
      res.send({
        message: "submitted",
        error: error.response.data,
      });
    });
});

/************************************************************************/

/*Requesitos*/

app.get("/getRequisitos", async (req, res) => {
    axios
      .get(`${API_URL}/transactions`)
      .then((response) => {
        return response.data.data;
      })
      .then((data) => {
        
        let resPayloads = [];
        data.forEach((element) => {
          if (
            element != data[data.length - 1] &&
            element != data[data.length - 2] && 
            element != data[data.length - 3]
          ) {
            let payload = element.payload;
  
            let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
            console.log(
              decodedPayload +
                "\n---------------------------------------------------------------------"
            );
  
            decodedPayload = JSON.parse(decodedPayload);
  
            if (
              decodedPayload.categoria === "requisito"
            ) {
              resPayloads.push(decodedPayload);
            }
          }
        });
  
        console.log(
          "--------------------------- PAYLOADS ARRAY --------------------------\n" +
            JSON.stringify(resPayloads) +
          "\n---------------------------------------------------------------------\n"
        );
        // res.contentType("application/json");
        // res.send(JSON.parse("[" + resPayloads + "]"));
        res.send(resPayloads);
      })
      .catch((error) => {
        console.log(error);
      });
});

app.post("/insertRequisito", async (req, res) => {
    let address = TP_NAMESPACE + _hash("sampleKey").substr(0, 64);
    const payload = req.body;

    // Input for one transaction
    const payloadBytes = Buffer.from(JSON.stringify(payload));

    // Output we created with this transaction input

    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: TP_FAMILY,
      familyVersion: TP_VERSION,
      // Needs to be same as the expected address we create in contract
      // If diffrent we wont get access to put state and get state of the address
      inputs: [address],
      outputs: [address],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash("sha512").update(payloadBytes).digest("hex"),
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);

    // Sign the transaction
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes,
    });

    // Wrap it into list of transaction
    const transactions = [transaction];

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    // Wrap the transaction list into batch
    const batchSignature = signer.sign(batchHeaderBytes);

    // And sign it
    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: batchSignature,
      transactions: transactions,
    });

    // Wrap them in batch list
    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch],
    }).finish();
    axios
      .post(`${API_URL}/batches`, batchListBytes, {
        headers: { "Content-Type": "application/octet-stream" },
      })
      .then((response) => {
        console.log({
          address,
          TP_NAMESPACE,
        });
        console.log(response.dadosdata);

        res.send({
          message: "submitted",
          data: response.data,
        });
      })
      .catch((error) => {
        console.error(error);
        res.send({
          message: "submitted",
          error: error.response.data,
        });
      });
});

/*************************************************************************/

/* Users */
app.post("/insertUser", async (req, res) => {
    let address = TP_NAMESPACE + _hash("sampleKey").substr(0, 64);
    const payload = { id: req.body.id,
	id_antigo: req.body.id_antigo,
	utilizador: req.body.utilizador,
	password: req.body.password,
	nomeCompleto: req.body.nomeCompleto,
	contacto: req.body.contacto,
	tipo: req.body.tipo,
	categoria:'utilizador'}
	
	
	console.log(req.body);

    // Input for one transaction
    const payloadBytes = Buffer.from(JSON.stringify(payload));

    // Output we created with this transaction input

    const transactionHeaderBytes = protobuf.TransactionHeader.encode({
      familyName: TP_FAMILY,
      familyVersion: TP_VERSION,
      // Needs to be same as the expected address we create in contract
      // If diffrent we wont get access to put state and get state of the address
      inputs: [address],
      outputs: [address],
      signerPublicKey: signer.getPublicKey().asHex(),
      batcherPublicKey: signer.getPublicKey().asHex(),
      dependencies: [],
      payloadSha512: createHash("sha512").update(payloadBytes).digest("hex"),
    }).finish();

    const signature = signer.sign(transactionHeaderBytes);

    // Sign the transaction
    const transaction = protobuf.Transaction.create({
      header: transactionHeaderBytes,
      headerSignature: signature,
      payload: payloadBytes,
    });

    // Wrap it into list of transaction
    const transactions = [transaction];

    const batchHeaderBytes = protobuf.BatchHeader.encode({
      signerPublicKey: signer.getPublicKey().asHex(),
      transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish();

    // Wrap the transaction list into batch
    const batchSignature = signer.sign(batchHeaderBytes);

    // And sign it
    const batch = protobuf.Batch.create({
      header: batchHeaderBytes,
      headerSignature: batchSignature,
      transactions: transactions,
    });

    // Wrap them in batch list
    const batchListBytes = protobuf.BatchList.encode({
      batches: [batch],
    }).finish();
    axios
      .post(`${API_URL}/batches`, batchListBytes, {
        headers: { "Content-Type": "application/octet-stream" },
      })
      .then((response) => {
        console.log({
          address,
          TP_NAMESPACE,
        });
        console.log(response.dadosdata);

        res.send({
          message: "submitted",
          data: response.data,
        });
      })
      .catch((error) => {
        console.error(error);
        res.send({
          message: "submitted",
          error: error.response.data,
        });
      });
});

app.get("/getUsers", async (req, res) => {
    axios
      .get(`${API_URL}/transactions`)
      .then((response) => {
        return response.data.data;
      })
      .then((data) => {
        
        let resPayloads = [];
        data.forEach((element) => {
          if (
            element != data[data.length - 1] &&
            element != data[data.length - 2] && 
            element != data[data.length - 3]
          ) {
            let payload = element.payload;
  
            let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
            console.log(
              decodedPayload +
                "\n---------------------------------------------------------------------"
            );
  
            decodedPayload = JSON.parse(decodedPayload);
  
            if (
              decodedPayload.categoria === "utilizador"
            ) {
              resPayloads.push(decodedPayload);
            }
          }
        });
  
        console.log(
          "--------------------------- PAYLOADS ARRAY --------------------------\n" +
            JSON.stringify(resPayloads) +
          "\n---------------------------------------------------------------------\n"
        );
        // res.contentType("application/json");
        // res.send(JSON.parse("[" + resPayloads + "]"));
        res.send(resPayloads);
      })
      .catch((error) => {
        console.log(error);
      });
});

/***************************************************************************/

/* Clientes */
app.get("/getClientes", async (req, res) => {
  axios
    .get(`${API_URL}/transactions`)
    .then((response) => {
      return response.data.data;
    })
    .then((data) => {
      
      let resPayloads = [];
      data.forEach((element) => {
        if (
          element != data[data.length - 1] &&
          element != data[data.length - 2] && 
          element != data[data.length - 3]
        ) {
          let payload = element.payload;

          let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
          console.log(
            decodedPayload +
              "\n---------------------------------------------------------------------"
          );

          decodedPayload = JSON.parse(decodedPayload);

          if (
            decodedPayload.tipo === "Cliente"
          ) {
            resPayloads.push(decodedPayload);
          }
        }
      });

      console.log(
        "--------------------------- PAYLOADS ARRAY --------------------------\n" +
          JSON.stringify(resPayloads) +
        "\n---------------------------------------------------------------------\n"
      );
      // res.contentType("application/json");
      // res.send(JSON.parse("[" + resPayloads + "]"));
      res.send(resPayloads);
    })
    .catch((error) => {
      console.log(error);
    });
});

/* Developer */
app.get("/getDevelopers", async (req, res) => {
  axios
    .get(`${API_URL}/transactions`)
    .then((response) => {
      return response.data.data;
    })
    .then((data) => {
      
      let resPayloads = [];
      data.forEach((element) => {
        if (
          element != data[data.length - 1] &&
          element != data[data.length - 2] && 
          element != data[data.length - 3]
        ) {
          let payload = element.payload;

          let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
          console.log(
            decodedPayload +
              "\n---------------------------------------------------------------------"
          );

          decodedPayload = JSON.parse(decodedPayload);

          if (
            decodedPayload.tipo === "Developer"
          ) {
            resPayloads.push(decodedPayload);
          }
        }
      });

      console.log(
        "--------------------------- PAYLOADS ARRAY --------------------------\n" +
          JSON.stringify(resPayloads) +
        "\n---------------------------------------------------------------------\n"
      );
      // res.contentType("application/json");
      // res.send(JSON.parse("[" + resPayloads + "]"));
      res.send(resPayloads);
    })
    .catch((error) => {
      console.log(error);
    });
});

/* Gestores */
app.get("/getGestores", async (req, res) => {
  axios
    .get(`${API_URL}/transactions`)
    .then((response) => {
      return response.data.data;
    })
    .then((data) => {
      
      let resPayloads = [];
      data.forEach((element) => {
        if (
          element != data[data.length - 1] &&
          element != data[data.length - 2] && 
          element != data[data.length - 3]
        ) {
          let payload = element.payload;

          let decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
          console.log(
            decodedPayload +
              "\n---------------------------------------------------------------------"
          );

          decodedPayload = JSON.parse(decodedPayload);

          if (
            decodedPayload.tipo === "Gestor de Equipa"
          ) {
            resPayloads.push(decodedPayload);
          }
        }
      });

      console.log(
        "--------------------------- PAYLOADS ARRAY --------------------------\n" +
          JSON.stringify(resPayloads) +
        "\n---------------------------------------------------------------------\n"
      );
      // res.contentType("application/json");
      // res.send(JSON.parse("[" + resPayloads + "]"));
      res.send(resPayloads);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(8080, () => console.log("Server started"));
