document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelectorAll('.inbox').forEach(btn => btn.addEventListener('click', () => load_mailbox('inbox')));
  document.querySelectorAll('.sent').forEach(btn => btn.addEventListener('click', () => load_mailbox('sent')));
  document.querySelectorAll('.archived').forEach(btn => btn.addEventListener('click', () => load_mailbox('archive')));
  document.querySelectorAll('.junk').forEach(btn => btn.addEventListener('click', () => load_mailbox('junk')));
  document.querySelectorAll('.compose').forEach(btn => btn.addEventListener('click', compose_email));
  document.querySelector('#compose-form').addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  const emailsContainer = document.createElement("div");
  emailsContainer.className = "container-fluid";

  const emailsView = document.querySelector('#emails-view');
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  emailsView.appendChild(emailsContainer);

  // fetch all the emails in the corrensponding mailbox
  fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
          // create div for each email in the corrensponding mailbox
          emails.forEach(email => {
              let div = document.createElement("div")

              div.id = email["id"];
              div.className = "email row p-2 p-lg-3 flex-column flex-md-row align-items-md-center "
              div.className += email["read"] ? "read" : "unread";

              const test = email['recipients'].map(recipient => 
                  recipient.slice(0,recipient.indexOf("@"))
              )
              
              console.log(test)

              if (mailbox == "sent") {
                  div.innerHTML = `
                              <span class="recipients col-md-2"> ${test} </span>
                              <span class="subject col-md-4 text-truncate"> ${email['subject']} </span>
                              <span class="timestamp col-md-2"> ${email['timestamp']} </span>
                              `;
              }
              else {
                  div.innerHTML = `
                              <span class="sender col-md-2"> ${email['sender'].slice(0,email['sender'].indexOf("@"))} </span>
                              <span class="subject col-md-4 text-truncate"> ${email['subject']} </span>
                              <span class="timestamp col-md-2"> ${email['timestamp']} </span>
                              `;
              }

              const btnGroups = document.createElement("div");
              btnGroups.className = "emails-btn-groups col-md-4";

              if (mailbox != "sent") {
                  const archiveBtn = document.createElement("button");
                  archiveBtn.className = "emails-archieve-btn";
                  archiveBtn.innerHTML = '<i class="bi bi-archive"></i>';

                  archiveBtn.addEventListener("click", e => {
                      archieve_email(email["id"], email["archived"], mailbox);
                      e.stopPropagation();
                  }, { capture: true });

                  btnGroups.appendChild(archiveBtn);
              }

              const junkBtn = document.createElement("button");
              junkBtn.className = "emails-junk-btn";
              junkBtn.innerHTML = '<i class="bi bi-trash"></i>'
              junkBtn.addEventListener("click", e => {
                  toggle_junk(email["id"], email["junk"], mailbox);
                  e.stopPropagation();
              }, { capture: true });

              btnGroups.appendChild(junkBtn);

              div.appendChild(btnGroups);
              div.addEventListener("click", () => {
                  view_email(email["id"])
              })

              emailsContainer.appendChild(div);
          })
      })
}

function send_email(event) {

  event.preventDefault();

  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients, subject, body })
  })
      .then(response => load_mailbox('sent'))
}

function view_email(id) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  const emailView = document.querySelector('#email-view');
  while (emailView.firstChild) {
      emailView.removeChild(emailView.firstChild);
  }

  // fetch the single email based on the id and show its detail
  fetch(`/emails/${id}`)
      .then(response => response.json())
      .then(email => {
          const subject = document.createElement("h3");
          subject.innerHTML = email["subject"];

          const div = document.createElement("div");
          div.className = "email-info";

          const sender = document.createElement("span");
          sender.className = "sender";
          sender.innerHTML = "From: " + email["sender"];

          const recipients = document.createElement("span");
          recipients.className = "recipients";
          recipients.innerHTML = "To: " + email["recipients"];

          const timestamp = document.createElement("span");
          timestamp.className = "timestamp";
          timestamp.innerHTML = email['timestamp'];

          div.appendChild(sender);
          div.appendChild(recipients);
          div.appendChild(timestamp);

          const content = document.createElement("p");
          content.className = "email-body";
          content.innerHTML = email["body"];

          const archiveBtn = document.createElement("button");
          archiveBtn.className = "archive-btn";
          if (!email["archived"])
              archiveBtn.innerHTML = "Archive";
          else
              archiveBtn.innerHTML = "Unarchive";

          archiveBtn.addEventListener("click", () => {
              archieve_email(email["id"], email["archived"], null)
          }, { capture: true });

          const replyBtn = document.createElement("button");
          replyBtn.className = "reply-btn";
          replyBtn.innerText = "Reply";
          replyBtn.onclick = () => {
              compose_email();

              document.querySelector('#compose-recipients').value = email['sender'];
              document.querySelector("#compose-subject").value = "Re: " + email["subject"];

              const body = `\n\n\nOn ${email['timestamp']}, ${email['sender']} wrote:\r\n\t${email['body']}`
              document.querySelector('#compose-body').value = body;
          }

          const junkBtn = document.createElement("button");
          junkBtn.className = "junk-btn";
          if (!email["junk"])
              junkBtn.innerText = "Junk";
          else
              junkBtn.innerHTML = "Delete";

          junkBtn.addEventListener("click", () => {
              toggle_junk(email["id"], email["archived"], null)
          }, { capture: true });

          const buttonsDisplay = document.createElement("div");
          buttonsDisplay.className = "btns-display d-flex d-md-block justify-content-evenly";
          buttonsDisplay.appendChild(replyBtn);
          buttonsDisplay.appendChild(archiveBtn);
          buttonsDisplay.appendChild(junkBtn);

          emailView.appendChild(subject);
          emailView.appendChild(document.createElement("hr"));
          emailView.appendChild(div);
          emailView.appendChild(content);
          emailView.appendChild(document.createElement("hr"));
          emailView.append(buttonsDisplay);

          if (!email["read"]) {
              fetch(`/emails/${email["id"]}`, {
                  method: "PUT",
                  body: JSON.stringify({ read: true })
              });
          }
      });
}

function archieve_email(id, is_archived, mailbox) {

  // Send a PUT request to update the archieve status of the particular email
  fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({ archived: !is_archived, junk: false })
  })
      .then(() => {
          if (mailbox == null)
              view_email(id);

          else
              load_mailbox(mailbox);
      })
}

function toggle_junk(id, in_junk, mailbox) {

  // Delete the email if it is already in junk
  if (in_junk) {
      fetch(`/emails/${id}`, {
          method: "DELETE"
      })
          .then(() => {
              console.log(`Email #${id} has been deleted`);
              load_mailbox("junk");
          })
  }

  // Send a PUT request to update the junk status of the particular email in order to put in junk mailbox
  else {
      fetch(`/emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({ junk: !in_junk })
      })
          .then(() => {
              if (mailbox == null)
                  view_email(id);

              else
                  load_mailbox(mailbox);
          })
  }
}