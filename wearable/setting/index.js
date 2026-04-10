/**
 * ZeppCompanion Settings Page
 *
 * Runs on the phone in the Zepp companion app (HTTPS WebView).
 * Cannot make HTTP requests directly (mixed content blocked).
 * Login is triggered via settingsStorage → side service picks it up.
 */

var inputStyle = {
  fontSize: "16px",
  color: "#000000",
  backgroundColor: "#FFFFFF",
  borderStyle: "solid",
  borderColor: "#DDDDDD",
  borderWidth: "1px",
  borderRadius: "10px",
  padding: "4px 12px",
  marginTop: "6px",
  height: "40px",
  width: "100%",
}

var labelStyle = {
  fontSize: "13px",
  color: "#888888",
}

AppSettingsPage({
  state: {
    apiBase: "",
    email: "",
    password: "",
    authStatus: "",
    userName: "",
    loginError: "",
  },

  build(props) {
    this.state.apiBase =
      props.settingsStorage.getItem("apiBase") || "http://192.168.1.100:3000"
    this.state.email = props.settingsStorage.getItem("email") || ""
    this.state.authStatus =
      props.settingsStorage.getItem("authStatus") || "not_configured"
    this.state.userName = props.settingsStorage.getItem("userName") || ""
    this.state.loginError = props.settingsStorage.getItem("loginError") || ""

    var isAuthenticated = this.state.authStatus === "authenticated"
    var isError = this.state.authStatus === "error"

    var that = this

    return View(
      {
        style: {
          padding: "20px 16px",
        },
      },
      [
        // ── Header ──
        View(
          {
            style: {
              textAlign: "center",
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "1px solid #E8E8E8",
            },
          },
          [
            Text(
              {
                bold: true,
                paragraph: true,
                align: "center",
                style: {
                  fontSize: "26px",
                  color: "#222222",
                  marginBottom: "4px",
                },
              },
              "ZeppCompanion"
            ),
            Text(
              {
                paragraph: true,
                align: "center",
                style: {
                  fontSize: "13px",
                  color: "#AAAAAA",
                  marginBottom: "16px",
                },
              },
              "Entrenador virtual con mascota"
            ),
            // Status pill
            isAuthenticated
              ? View(
                  {
                    style: {
                      backgroundColor: "#E8F5E9",
                      borderRadius: "20px",
                      padding: "8px 20px",
                      marginLeft: "30px",
                      marginRight: "30px",
                    },
                  },
                  [
                    Text(
                      {
                        align: "center",
                        style: {
                          fontSize: "14px",
                          color: "#2E7D32",
                          fontWeight: "600",
                        },
                      },
                      "Conectado: " + this.state.userName
                    ),
                  ]
                )
              : isError
                ? View(
                    {
                      style: {
                        backgroundColor: "#FFEBEE",
                        borderRadius: "20px",
                        padding: "8px 20px",
                        marginLeft: "30px",
                        marginRight: "30px",
                      },
                    },
                    [
                      Text(
                        {
                          align: "center",
                          style: {
                            fontSize: "14px",
                            color: "#C62828",
                            fontWeight: "600",
                          },
                        },
                        this.state.loginError || "Error de autenticacion"
                      ),
                    ]
                  )
                : View(
                    {
                      style: {
                        backgroundColor: "#F5F5F5",
                        borderRadius: "20px",
                        padding: "8px 20px",
                        marginLeft: "30px",
                        marginRight: "30px",
                      },
                    },
                    [
                      Text(
                        {
                          align: "center",
                          style: {
                            fontSize: "14px",
                            color: "#999999",
                            fontWeight: "600",
                          },
                        },
                        "Sin configurar"
                      ),
                    ]
                  ),
          ]
        ),

        // ── Server section ──
        View(
          {
            style: {
              backgroundColor: "#F8F8F8",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "16px",
              border: "1px solid #EEEEEE",
            },
          },
          [
            Text(
              {
                bold: true,
                style: {
                  fontSize: "11px",
                  color: "#AAAAAA",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                },
              },
              "SERVIDOR"
            ),
            TextInput({
              label: "URL del backend",
              placeholder: "http://192.168.1.100:3000",
              value: this.state.apiBase,
              labelStyle: labelStyle,
              subStyle: inputStyle,
              onChange: function (value) {
                that.state.apiBase = value
                props.settingsStorage.setItem("apiBase", value)
              },
            }),
          ]
        ),

        // ── Credentials section (when NOT authenticated) ──
        !isAuthenticated
          ? View(
              {
                style: {
                  backgroundColor: "#F8F8F8",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "20px",
                  border: "1px solid #EEEEEE",
                },
              },
              [
                Text(
                  {
                    bold: true,
                    style: {
                      fontSize: "11px",
                      color: "#AAAAAA",
                      letterSpacing: "1px",
                      marginBottom: "10px",
                    },
                  },
                  "CUENTA"
                ),
                TextInput({
                  label: "Email",
                  placeholder: "tu@email.com",
                  value: this.state.email,
                  labelStyle: labelStyle,
                  subStyle: inputStyle,
                  onChange: function (value) {
                    that.state.email = value
                    props.settingsStorage.setItem("email", value)
                  },
                }),
                View({ style: { height: "12px" } }),
                TextInput({
                  label: "Contrasena",
                  placeholder: "Tu contrasena",
                  value: this.state.password,
                  labelStyle: labelStyle,
                  subStyle: inputStyle,
                  onChange: function (value) {
                    that.state.password = value
                  },
                }),
              ]
            )
          : null,

        // ── Login button ──
        !isAuthenticated
          ? Button({
              label: "Iniciar Sesion",
              style: {
                fontSize: "17px",
                fontWeight: "bold",
                backgroundColor: "#4CAF50",
                color: "#FFFFFF",
                borderRadius: "14px",
                padding: "15px",
                width: "100%",
                border: "none",
                marginBottom: "16px",
              },
              onClick: function () {
                if (!that.state.email || !that.state.password) return
                // Write credentials to settingsStorage for the side service to pick up
                props.settingsStorage.setItem(
                  "loginTrigger",
                  JSON.stringify({
                    email: that.state.email,
                    password: that.state.password,
                  })
                )
              },
            })
          : null,

        // ── Authenticated: account info + logout ──
        isAuthenticated
          ? View(
              {
                style: {
                  backgroundColor: "#F8F8F8",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px",
                  border: "1px solid #EEEEEE",
                },
              },
              [
                Text(
                  {
                    bold: true,
                    style: {
                      fontSize: "11px",
                      color: "#AAAAAA",
                      letterSpacing: "1px",
                      marginBottom: "10px",
                    },
                  },
                  "CUENTA"
                ),
                Text(
                  {
                    style: {
                      fontSize: "16px",
                      color: "#333333",
                      marginBottom: "16px",
                    },
                  },
                  this.state.email
                ),
                Button({
                  label: "Cerrar Sesion",
                  style: {
                    fontSize: "15px",
                    fontWeight: "600",
                    backgroundColor: "#FFFFFF",
                    color: "#EF5350",
                    borderRadius: "12px",
                    padding: "12px",
                    width: "100%",
                    border: "2px solid #EF5350",
                  },
                  onClick: function () {
                    props.settingsStorage.removeItem("accessToken")
                    props.settingsStorage.removeItem("userName")
                    props.settingsStorage.removeItem("loginError")
                    props.settingsStorage.setItem("authStatus", "not_configured")
                  },
                }),
              ]
            )
          : null,

        // ── Footer ──
        View(
          {
            style: {
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #EEEEEE",
            },
          },
          [
            Text(
              {
                align: "center",
                style: { fontSize: "12px", color: "#CCCCCC" },
              },
              "ZeppCompanion v1.0.0"
            ),
          ]
        ),
      ]
    )
  },
})
