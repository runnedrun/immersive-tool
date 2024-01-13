import { Message, ServerClient } from "postmark";

const senderEmailAddress = "card@decks.xinqing-david.com";
const ccEmailAddresses = "runnedrun@gmail.com";
import { defineString } from "firebase-functions/params";

const env = defineString("POSTMARK_ID");

const postMarkId = () => env.value();

export const sendEmail = (email: string, content: string, subject: string) => {
  const key = postMarkId();
  const client = new ServerClient(key);

  const emailToSendFrom = `${senderEmailAddress}`;
  const msg = {
    From: emailToSendFrom,
    Cc: ccEmailAddresses,
    To: email,
    Subject: subject,
    HtmlBody: content,
    MessageStream: "outbound",
  } as Message;
  console.log("sending email", JSON.stringify(msg, null, 2));
  if (key) {
    return client.sendEmail(msg).then(
      (r) => {
        console.log("Email sent");
      },
      (error) => {
        console.error("email error", JSON.stringify(error));
      }
    );
  } else {
    console.log("no postmark api key, skipping");
    return Promise.resolve();
  }
};
