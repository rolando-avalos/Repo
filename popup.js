let leerWeb = document.getElementById("leerWeb");
let btnGuardarMovimientos = document.getElementById("btnGuardarMovimientos");
// let _url_ = "http://192.168.90.15/Intranet/apibanco/consulta.php";
// let _allowOrigin_ = "http://192.168.90.15/Intranet/view/index.php"; 
let _url_ = "http://intranet.metalmark.pe/Intranet/apibanco/consulta.php";
let _allowOrigin_ = "http://intranet.metalmark.pe/Intranet/view/index.php"; 
let bancoSeleccionado = [];
let cuentaSede = [];

// obtener empresas
getBank();

// carga de empresas
function getBank() {
	$(".mensaje").hide();
	$(".tabla").hide();
	let empresa = $("#empresa");

	$.ajax({
		type: "GET",
		dataType: "json",
		contentType: 'application/json',
		headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": _allowOrigin_,
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
		url: _url_,
		data: "op=obtenerEmpresa",

		success: function (datos) {
			empresa.find('option').remove();
			empresa.append(`<option value="-1" selected>-- SELECCIONE --</option>`);
			$(datos).each(function (i, v) { // indice, valor
				empresa.append(`<option value='${v.id}'> ${v.descripcion} </option>`);
			});
		}
	});
}

// onchange para empresa -> carga de bancos
$('#empresa').change(function () {
	let empresaId = $("#empresa").val();
	if (empresaId != -1) {
		let banco = $('#banco');
		banco.val('-1');

		$.ajax({
			type: "get",
			dataType: "json",
			contentType: 'application/json',
			headers: {
				"Access-Control-Allow-Headers" : "Content-Type",
				"Access-Control-Allow-Origin": _allowOrigin_,
				"Access-Control-Allow-Methods": "OPTIONS,POST,GET"
			},
			url: _url_,
			data: `op=obtenerBanco&empresaId=${empresaId}`,

			success: function (datos) {
				bancos = datos;
				banco.find('option').remove();
				banco.append(`<option value="-1" selected>-- SELECCIONE --</option>`);
				$(datos).each(function (i, v) { // indice, valor
					banco.append(`<option value='${v.id}'> ${v.descripcion.toUpperCase()} </option>`);
				});
			},
			error: function (xhr, status, error) {
				mostrarError("Error!" + xhr.status + error);
			}
		});
	} else {
		mostrarError("No se ha seleccionado ninguna empresa");
	}
});

// obtener cuentas de acuerdo a banco y empresa seleccionada
leerWeb.addEventListener("click", () => {
	let empresaId = $("#empresa").val();
	let bancoId = $("#banco").val();
	let dataMovimientos = '';
	$(".tabla").hide();
	chrome.storage.sync.set({ dataMovimientos });
	if (empresaId != -1 && bancoId != -1) {
		$.ajax({
			type: "get",
			dataType: "json",
			contentType: 'application/json',
			headers: {
				"Access-Control-Allow-Headers" : "Content-Type",
				"Access-Control-Allow-Origin": _allowOrigin_,
				"Access-Control-Allow-Methods": "OPTIONS,POST,GET"
			},
			url: _url_,
			data: `op=obtenerCuentaBanco&empresaId=${empresaId}&bancoId=${bancoId}`,

			success: function (datos) {
				cuentaSede = datos;
				leerMovimientos(bancoId, datos);
			},
			error: function (xhr, status, error) {
			}
		});
	} else {
		mostrarError("Por favor seleccione banco y empresa");
	}
});

// Mostrar mensajes en ventana de extensió
function mostrarError(mensaje) {
	$("#mensajeError").html(mensaje);
	$(".mensaje").show();
	setTimeout(() => {
		$(".mensaje").hide();
		let listaDetalle = '';
		chrome.storage.sync.set({ listaDetalle });
	}, 5000);
}

function leerMovimientos(bancoId, listaCuentas) {
	bancoSeleccionado = bancos.find(iterador => iterador.id == bancoId);
	if(listaCuentas.length > 0) {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
			let url = tabs[0].url;
			if(listaCuentas[0].Valor_banco == url) {
				leerFrame(listaCuentas, bancoSeleccionado);
			} else {
				mostrarError("La web a consultar no pertenece a alguna de las entidades bancarias registradas en configuraciones");
			}
		});
	} else {
		mostrarError('No se pudo obtener los datos de la cuenta');
	}
}

// Redireccionar lectura de DOM de web
async function leerFrame(listaCuentas, bancoSeleccionado) {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	let config = { bancoSeleccionado, listaCuentas };
	config = JSON.stringify(config);
	chrome.storage.local.set({ config });
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		// function: leerMovimientosBCP,
		files: [ 'content.js' ]
	});
}

// mostrar datos obtenidos de bancos
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
	let url = tabs[0].url;
	let dataDetalle;
	chrome.storage.sync.get("dataMovimientos", ({ dataMovimientos }) => {
		if(dataMovimientos != '') {
			dataMovimientos = JSON.parse(dataMovimientos);
			if (dataMovimientos != null && dataMovimientos != {}) {
				if(dataMovimientos.url == url) {
					$(".tabla").show();
					dataDetalle = dataMovimientos.listaDetalle;
					dibujarTabla(dataMovimientos.listaDetalle);
					setTimeout(() => {
						let dataMovimientos = '';
						// $(".tabla").hide();
						chrome.storage.sync.set({ dataMovimientos });
						chrome.storage.sync.set({ dataDetalle });
					}, 1000);
				} else {
					let dataMovimientos = '';
					chrome.storage.sync.set({ dataMovimientos });
					chrome.storage.sync.set({ dataDetalle });
				}
			}
		}
	});
});

// Dibujar tabla
function dibujarTabla(listaDetalle) {
	let table = document.getElementById("tablaMovimientos");
	let data = Object.keys(listaDetalle[0]);
	let campos = ['Fecha', 'Descripción', 'Monto', 'Nº Operación'];
	let camposObjeto = ['FechaOperacion', 'Descripcion', 'Monto', 'NroOperacion'];
	generateTableHead(table, campos);
	generateTable(table, listaDetalle, camposObjeto);
}
function generateTableHead(table, campos) {
	let thead = table.createTHead();
	let row = thead.insertRow();
	for (let key of campos) {
		let th = document.createElement("th");
		let text = document.createTextNode(key);
		th.appendChild(text);
		row.appendChild(th);
	}
}
function generateTable(table, data, camposObjeto) {
	for (let element of data) {
		let row = table.insertRow();
		for (let item of camposObjeto) {
			if (element.Tipo < 1) {
				row.className = "egreso";
			}
			let cell = row.insertCell();
			let text;
			if(item == 'Monto') {
				text = document.createTextNode( new Intl.NumberFormat("es-PE", {minimumFractionDigits: 2}).format(element[item].toFixed(2)) );
				cell.className = "tableNumber";
			} else {
				text = document.createTextNode(element[item]);
			}
			cell.appendChild(text);
		}
	}
}

// enviar movimientos obtenidos a servicio para ser almacenado en BD
btnGuardarMovimientos.addEventListener("click", () => {
	let check = $('#checkEgresos').is(':checked');
	let data;
	chrome.storage.sync.get("dataDetalle", ({ dataDetalle }) => {
		if(dataDetalle != '' || dataDetalle != []) {
			if(check) {
				data = dataDetalle;
			} else {
				data = dataDetalle.filter(item => item.Monto > -1);
			}
			data = { data: data};
			data = JSON.stringify(data);
			
			console.log(data);
		} else {
			mostrarError('No se encontraron registros de movimientos bancarios');
		}
	});
});