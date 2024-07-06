import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import "https://deno.land/x/dotenv/load.ts";
const client = new SmtpClient();

const { FROM_EMAIL, PWD, TO_EMAIL, COUNTRY_CODE } = Deno.env.toObject();

const STARLINK_API = "https://api.starlink.com/public-files/availability.json";

const connectConfig: any = {
  hostname: "smtp.gmail.com",
  port: 465,
  username: FROM_EMAIL,
  password: PWD,
};


async function sendMail(subject: string,  message: string) {
  await client.connectTLS(connectConfig);

  await client.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: subject,
    content: message
  });
  
  await client.close();
}


async function hasStarlinkLaunched(code: string) {
  try {
    const response = await fetch(STARLINK_API, {
      headers: {
        "Accept": "application/json",
      }
    });

    if (response.ok) {
      const json = await response.json();
      const country = json["admin0"][code.toUpperCase()];

      if (country && country['status'] === 'launched') {
        return true;
      } 
      else {
        return false;
      }
    } 
    else {
      console.error("Failed to fetch data:", response.status, response.statusText);
      return false;
    }
  } 
  catch (error) {
    console.error("Error occurred:", error);
    return false;
  }
}



Deno.cron("Email Starlink Update", "0 * * * *", async () => {
  const yes = await hasStarlinkLaunched(COUNTRY_CODE);

  const yesMessage = `Yay!! Starlink has launched in ${COUNTRY_CODE}!`;
  const noMessage = `Starlink has not launched in ${COUNTRY_CODE}.`;

  if(yes) {
    console.log(yesMessage);
    sendMail("Starlink Update",  yesMessage);
  }
  else {
    console.log(noMessage)
    sendMail("Starlink Update",  noMessage);
  }
});