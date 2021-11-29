chrome.storage.local.get("config", ({ config }) => {
    config = JSON.parse(config);
    bancoSeleccionado = config.bancoSeleccionado;
    listaCuentas = config.listaCuentas;

    switch (removeAccents(bancoSeleccionado.descripcion)) {
        case "Banco de Credito":
            leerMovimientosBCP(listaCuentas, bancoSeleccionado);
            break;
        case "Banco Continental":
            leerMovimientosBBVA(listaCuentas, bancoSeleccionado);
            break;
        case "Caja Trujillo":
            leerMovimientosCajaTrujillo(listaCuentas, bancoSeleccionado);
            break;
        case "Banco Interbank":
            leerMovimientosInterbank(listaCuentas, bancoSeleccionado);
            break;
        case "Scotiabank":
            leerMovimientosScotiabank(listaCuentas, bancoSeleccionado);
            break;
        case "Caja Arequipa":
            leerMovimientosCajaArequipa(listaCuentas, bancoSeleccionado);
            break;
        case "Caja Sullana":
            leerMovimientosCajaSullana(listaCuentas, bancoSeleccionado);
            break;
        case "Banco de la Nacion":
            leerMovimientosBancoNacion(currentWindow, bancoSeleccionado);
            break;
        default:
            alert('No se encuentra banco seleccionado');
            break;
    }
});

function removeAccents(str) {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function validarDigitosNumericos(cadena) {
    for (let i = 0; i < cadena.length; i++) {
        if(isNaN(parseInt(cadena[i]))) {
            return false;
        }
    }
    return true;
}

function leerMovimientosBCP(listaCuentas, bancoSeleccionado) {
    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    let usandoHistorico = true;
    let detalle = {};

    let collection;
    let listaDetalle = [];
    let tr;
    let controlRows;
    let controlColumns;
    let td;
    let htmlElement;
    htmlElement = window.frames[0].document.getElementById(listaCuentas[0].ParametroChar2_banco);

    if (htmlElement != null) {
        collection = htmlElement.getElementsByTagName('table');
        tr = collection[0].getElementsByTagName('tr');
        controlRows = 0;
        for (let element of tr) {
            controlColumns = 0;
            switch (controlRows) {
                case 0:
                    td = element.children;
                    for (let elem of td) {
                        if (controlColumns == 1) {
                            cuentaSede = listaCuentas.filter(it => it.Valor == elem.innerText.trim().substring(0, 16));
                            if (cuentaSede == null || cuentaSede == '' || cuentaSede == [] || cuentaSede.length == 0) {
                                alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
                                return;
                            }
                            if (cuentaSede.length > 1) {
                                alert(`Existe ${cuentaSede.length} cuentas registradas con el número de cuenta ${elem.innerText.trim().substring(0, 16)}, revisar la cuenta en las configuraciones.`);
                                return;
                            } else {
                                cuentaSede = cuentaSede[0];
                            }
                        }
                        controlColumns++;
                    }
                    break;
                case 1:
                    td = element.children;
                    for (let elem of td) {
                        if (controlColumns == 1) {
                            if (elem.innerText.trim() != cuentaSede.ParametroChar3) {
                                alert("La moneda de la cuenta no corresponde a la moneda que se intenta subir.");
                                return -1;
                            }
                        }
                        controlColumns++;
                    }
                    break;
                default:
                    break;
            }
            controlRows++;
        }
    }
    else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.");
        return -1;
    }
    htmlElement = window.frames[0].document.getElementById(cuentaSede.ParametroChar1_banco);
    controlRows = 0;

    if (htmlElement == null && collection != null) {
        htmlElement = collection[2];
        usandoHistorico = false;
        controlRows++;
    }

    if (htmlElement != null) {
        tr = htmlElement.getElementsByTagName('tr');
        for (let element of tr) {
            detalle = {};
            if (controlRows >= 2) {
                collection = element.children;
                if (collection.length > 2) {
                    try {
                        detalle.FechaOperacion = `${collection[0].innerText} ${collection[7].innerText}`;
                    } catch (error) {
                        detalle.FechaOperacion = `${collection[0].innerText}`;
                    }
                    detalle.FechaProceso = detalle.FechaOperacion;
                    detalle.Descripcion = collection[2].innerText;
                    if (usandoHistorico) {
                        detalle.NroOperacion = collection[6].innerText;
                    } else {
                        detalle.NroOperacion = collection[5].innerText;
                    }
                    detalle.Monto = parseFloat(collection[3].innerText.replace(/,/gi, ''));
                    detalle.Sede = cuentaSede.sede.Id;
                    detalle.BancoId = cuentaSede.ID_banco;
                    detalle.CuentaBanco = cuentaSede.CuentaId;
                    if(cuentaSede.EmpresaId == 1) {
                        detalle.IdEmpresa = 2;
                    } else {
                        detalle.IdEmpresa = 1;
                    }

                    if (detalle.Descripcion.indexOf("EFECT") != -1) {
                        detalle.NroDocumento = detalle.Descripcion.substring(detalle.Descripcion.length - 11);
                        if (detalle.NroDocumento[0] == '0') {
                            detalle.NroDocumento = detalle.NroDocumento.substring(3);
                        }
                    }

                    if (detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }
                    listaDetalle.push(detalle);
                }
                else {
                    break;
                }
            }
            controlRows++;
        }
        if(listaDetalle.length > 0) {
            let url = cuentaSede.Valor_banco;
            let dataMovimientos = { url: url , listaDetalle: listaDetalle };
            dataMovimientos = JSON.stringify(dataMovimientos);
            chrome.storage.sync.set({ dataMovimientos });
            alert(`${listaDetalle.length} movimientos encontrados`);
        } else {
            alert(`No se encontraron movimientos bancarios`);
        }

    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.");
    }
}

function leerMovimientosBBVA(listaCuentas, bancoSeleccionado) {
    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    let classElement;
    let controlAux;
    let listaDetalle = [];
    let myWindows = window.frames['IÉSIMO'];

    if(myWindows.name == listaCuentas[0].ParametroChar2_banco) {
        collection = myWindows.document.getElementsByTagName('table');
        controlRows = 0;
        for(let element of collection) {
            classElement = element.getAttribute('class'); // split(element.getAttribute('class'))
            if(classElement == listaCuentas[0].ParametroChar1) {
                if(controlRows == 0) {
                    controlAux = 0;
                    htmlElement = element;
                    tr = htmlElement.getElementsByTagName('tr');
                    for(let trElement of tr) {
                        switch (controlAux) {
                            case 1:
                                text = trElement.getElementById('td')[0].innerText;
                                cuentaSede = listaCuentas.filter(it => it.Valor == text);
                                if (cuentaSede == null || cuentaSede == '' || cuentaSede == [] || cuentaSede.length == 0) {
                                    alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
                                    return;
                                }
                                if (cuentaSede.length > 1) {
                                    alert(`Existe ${cuentaSede.length} cuentas registradas con el número de cuenta ${elem.innerText.trim().substring(0, 16)}, revisar la cuenta en las configuraciones.`);
                                    return;
                                } else {
                                    cuentaSede = cuentaSede[0];
                                }
                                // if(cuenta == cuentaSede.ParametroChar2) {
                                //     alert("La cuenta no corresponde a la sede seleccionada, seleccionar sede correcta.");
                                //     return;
                                // }
                                // break;

                            case 3:
                                let controlTd = 0;
                                td = element.children;
                                for(let tdElement of td) {
                                    if(controlTd == 2) {
                                        if(cuentaSede.ParametroChar3 != tdElement.innerText) {
                                            alert("La moneda de la cuenta no corresponde a la moneda que se intenta subir");
                                        }
                                    }
                                    // switch (controlTd) {
                                    //     case 0:
                                    //         saldoContable = parseFloat(tdElement.innerText);
                                    //         break;
                                    //     case 1:
                                    //         saldoDisponible = parseFloat(tdElement.innerText);
                                    //         break;
                                    //     case 2:
                                    //         if(cuentaSede.ParametroChar3 != tdElement.innerText) {
                                    //             alert("La moneda de la cuenta no corresponde a la moneda que se intenta subir");
                                    //         }
                                    //         break;
                                    // }
                                    controlTd++;
                                }
                                break;
                            default:
                                break;
                        }
                        controlAux++;
                    }
                    controlRows++;
                } else {
                    htmlElement = element;
                }
            }
        }
        
        controlRows = 0;
        if(htmlElement != null) {
            for(let element of htmlElement.getElementsByTagName('tr')) {
                if(controlRows >= 3) {
                    collection = element.getElementsByTagName("td");
                    detalle = {};
                    detalle.FechaOperacion = parseFloat(collection[1].innerText);
                    detalle.FechaProceso = parseFloat(collection[0].innerText);
                    detalle.Descripcion = collection[2].innerText;
                    detalle.NroOperacion = collection[5].innerText;
                    detalle.Monto = parseFloat(collection[3].innerText);
                    let itf = parseFloat(collection[4].innerText);
                    detalle.Sede = cuentaSede.sede.Id;
                    detalle.CuentaBanco = cuentaSede.CuentaId;
                    detalle.BancoId = cuentaSede.ID_banco;
                    detalle.IdEmpresa = cuentaSede.EmpresaId;

                    if(!isNaN(parseInt(detalle.Descripcion[0])) || !isNaN(parseInt(detalle.Descripcion[1]))) {
                        let a = detalle.Descripcion.substring(0,12);
                        if(!isNaN(parseInt(detalle.Descripcion[0]))) {
                            a = a.substring(0, 11);
                        } else {
                            a = a.substring(1);
                        }

                        if(validarDigitosNumericos(a)) {
                            detalle.NroDocumento = a;
                        } else {
                            detalle.NroDocumento = a.substring(0, 8);
                        }
                    }

                    if(detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }
                    listaDetalle.push(detalle);

                    if(itf != 0) {
                        detalle = {};
                        detalle.FechaOperacion = collection[0].innerText;
                        detalle.FechaProceso = collection [0].innerText;
                        detalle.Descripcion = collection[2].innerText + "- ITF";
                        detalle.NroOperacion = (parseInt(collection[5].innerText) + 1).toString;
                        detalle.Monto = itf;
                        detalle.sede = cuentaSede.sede.Id;
                        detalle.CuentaBanco = cuentaSede.CuentaId;
                        detalle.BancoId = cuentaSede.ID_banco;
                        if(detalle.Monto < 0) {
                            detalle.Tipo = -1;
                        } else {
                            detalle.Tipo = 1;
                        }
                        if(cuentaSede.EmpresaId == 1) {
                            detalle.IdEmpresa = 2;
                        } else {
                            detalle.IdEmpresa = 1;
                        }

                        listaDetalle.push(detalle);
                    }
                }
                controlRows++;
            }
            if(listaDetalle.length > 0) {
                let url = cuentaSede.Valor_banco;
                let dataMovimientos = { url: url , listaDetalle: listaDetalle };
                dataMovimientos = JSON.stringify(dataMovimientos);
                chrome.storage.sync.set({ dataMovimientos });
                alert(`${listaDetalle.length} movimientos encontrados`);
            } else {
                alert(`No se encontraron movimientos bancarios`);
                return;
            }
        } else {
            alert('Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.');
            return;
        }
    }
}

function leerMovimientosCajaTrujillo(listaCuentas, bancoSeleccionado) {
    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    let htmlElement = document.getElementById(cuentaSede[0].ParametroChar2_banco);
    let controlRows = 0;
    let hojaActual = 0;
    let paginaControlCajaTrujillo = 1;
    let listaDetalle = [];

    if(htmlElement != null) {
        collection = htmlElement.getElementsByTagName('table');
        controlRows = 0;
        let t = collection[auxTableColectionIndex];

        tr = collection[auxTableColectionIndex].getElementsByTagName('tr');

        for(let element of tr) {
            if(controlRows == 2) {
                controlColumns = 0;
                td = element.GetElementsByTagName("td");
                for (let elem of td) {
                    switch(controlColumns) {
                        case 1:
                            cuentaSede = listaCuentas.filter(it => it.Valor == elem.innerText.trim().substring(0, 16));
                            if (cuentaSede == null || cuentaSede == '' || cuentaSede == [] || cuentaSede.length == 0) {
                                alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
                                return;
                            }
                            if (cuentaSede.length > 1) {
                                alert(`Existe ${cuentaSede.length} cuentas registradas con el número de cuenta ${elem.innerText.trim().substring(0, 16)}, revisar la cuenta en las configuraciones.`);
                                return;
                            } else {
                                cuentaSede = cuentaSede[0];
                            }
                            break;
                        case 3:
                            if(elem.innerText.indexOf(cuentaSede.ParametroChar3) < 0) {
                                alert("La moneda de la cuenta no corresponde a la moneda que se intenta subir.");
                            }
                            break;
                        default:
                            break;
                    }
                    controlColumns++;
                }
            }
            controlRows++;
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.");
    }

    htmlElement = document.getElementById(cuentaSede.ParametroChar1_banco);
    controlRows = 0;

    if(htmlElement != null) {
        tr = htmlElement.getElementsByTagName('tr');
        for (let element of tr) {
            if(controlRows >= 2) {
                detalle = {};
                collection = element.getElementsByTagName('td');

                if(collection.length > 1) {
                    detalle.FechaProceso = collection[0].innerText;
                    detalle.FechaOperacion = collection[1].innerText;
                    detalle.Descripcion = collection[2].innerText;
                    detalle.Monto = parseFloat(collection[3].innerText);
                    detalle.Sede = cuentaSede.sede.ID;
                    detalle.BancoId = cuentaSede.ID_banco;
                    detalle.CuentaBanco = cuentaSede.ID;
                    if(detalle.EmpresaId == 1) {
                        detalle.IdEmpresa = 2;
                    } else {
                        detalle.IdEmpresa = 1;
                    }
                    if(detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }
                    listaDetalle.push(detalle);

                    if(detalle.Tipo == 1 && detalle.Monto >= 1000) {
                        ctrlITF = parseInt(detalle.Monto / 1000);

                        while(ctrlITF * 1000 > detalle.Monto) {
                            ctrlITF--;
                        }

                        detalle = {};
                        detalle.FechaProceso = collection[0].innerText;
                        detalle.FechaProceso = collection[1].innerText;
                        detalle.Descripcion = "ITF";
                        detalle.Monto = ctrlITF * -0.05;
                        detalle.Sede = cuentaSede.sede.Id;
                        detalle.BancoId = cuentaSede.ID_banco;
                        detalle.CuentaBanco = cuentaSede.CuentaId;
                        detalle.Tipo = -1;
                        detalle.IdEmpresa = cuentaSede.EmpresaId;
                        listaDetalle.push(detalle);
                    }
                } else {
                    linkElement = collection[0];
                    collection = linkElement.getElementsByTagName("a");
                    metodoJS = [];
                    parametro1JS = [];
                    parametro2JS = [];
                    
                    for (let link of collection) {
                        auxJS = link.getAttribute('href');
                        auxJS = auxJS.split(':')[1];
                        metodoJS.push(auxJS.split('(')[0]);
                        auxJS = auxJS.split('(')[1];
                        parametro1JS.push(auxJS.split("\'")[1]);
                        parametro2JS.push(auxJS.split("\'")[3]);
                    }

                    for (let h of parametro1JS) {
                        if(!isNaN(parseInt(h.substring(h.length - 2)))) {
                            let hojaAux = parseInt(h.substring(h.length - 2));
                            if(hojaAux == 1 && hojaActual == 0) {
                                hojaActual = hojaAux - 1;
                                controlHojas = false;
                                esPrimero = true;
                            } else {
                                esPrimero = false;
                            }

                            if(hojaAux - hojaActual > 1) {
                                hojaActual = hojaAux - 1;
                                controlHojas = false;
                                break;
                            }
                            hojaActual = hojaAux;
                        }
                    }

                    if(controlHojas) {
                        hojaActual = 0;
                    }

                    for (let index = 0; index < metodoJS.length; index++) {                        
                        setInterval(() => {
                            window[metodoJS[i]](parametro1JS[i], parametro2JS[i]);
                            if(window.confirm("¿Quiere cargar los datos de la siguiente hoja de la tabla?")) {
                                do {
                                    if(hojaActual != paginaControlCajaTrujillo || esPrimero) {
                                        let distinct = null;
                                        listaDetalleSheets = leerMovimientoCajaTrujillo(cuentaSede);
                                        for (const det of listaDetalleSheets) {
                                            det.BancoId = cuentaSede.ID_banco;
                                            det.CuentaBanco = cuentaSede.CuentaId;
                                        }
                                        listaDetalle.push(...listaDetalleSheets);
                                        let fechaOperacion = listaDetalle[0].FechaOperacion;
                                        distinct = listaDetalle.find(it => it.FechaOperacion != fechaOperacion);
                                        if(distinct != null) {
                                            i = metodoJS.lenght;
                                        }
                                        controlDuplicado = false;
                                        controlError = 0;
                                    } else {
                                        alert("Debe esperar que cargue la siguiente hoja para evitar los movimientos duplicados");
                                        controlError++;

                                        if(controlError < 3) {
                                            controlDuplicado = true;
                                        } else {
                                            controlDuplicado = false;
                                        }

                                    }
                                }
                                while(controlDuplicado);
                            } else {
                                i = metodoJS.lenght;
                            }
                        }, 2000);                        
                    }
                }
            }
        }
        if(listaDetalle.length > 0) {
            let url = cuentaSede.Valor_banco;
            let dataMovimientos = { url: url , listaDetalle: listaDetalle };
            dataMovimientos = JSON.stringify(dataMovimientos);
            chrome.storage.sync.set({ dataMovimientos });
            alert(`${listaDetalle.length} movimientos encontrados`);
        } else {
            alert(`No se encontraron movimientos bancarios`);
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.");
    }
}

function leerMovimientoCajaTrujillo(cuentaSede) {
    let controlRows, ctrlITF;
    let htmlElement = document.getElementById(cuentaSede.ParametroChar1_banco);
    controlRows = 0;
    let listaDetalle = [];

    if(htmlElement != null) {
        let tr = htmlElement.getElementsByTagName('tr');
        for (const element of tr) {
            if(controlRows >= 2) {
                detalle = {};
                collection = element.GetElementsByTagName('td');

                if(collection.lenght > 1) {
                    detalle.FechaProceso = collection[0].innerText;
                    detalle.FechaOperacion = collection[1].innerText;
                    detalle.Descripcion = collection[2].innerText;
                    detalle.Monto = parseFloat(collection[3].innerText);
                    detalle.Sede = cuentaSede.sede.Id;
                    if(detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }
                    if(cuentaSede.EmpresaId == 1) {
                        detalle.IdEmpresa = 2;
                    } else {
                        detalle.IdEmpresa = 1;
                    }
                    listaDetalle.push(detalle);

                    if(detalle.Tipo === 1 && detalle.Monto >= 1000) {
                        ctrlITF = parseInt(detalle.Monto/1000);

                        while(ctrlITF * 1000 > detalle.Monto) {
                            ctrlITF--;
                        }

                        detalle = {};
                        detalle.FechaProceso = collection[0].innerText;
                        detalle.FechaOperacion = collection[1].innerText;
                        detalle.Descripcion = 'ITF';
                        detalle.Monto = ctrlITF * -0.05;
                        detalle.Sede = cuentaSede.sede.Id;
                        detalle.Tipo = -1;
                        if(cuentaSede.EmpresaId == 1) {
                            detalle.IdEmpresa = 2;
                        } else {
                            detalle.IdEmpresa = 1;
                        }
                        listaDetalle.push(detalle);
                    }
                }
            }
            controlRows++;
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente");
    }
    return listaDetalle;
}

function leerMovimientosScotiabank(listaCuentas, bancoSeleccionado) {
    let listaDetalle = [];

    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    let collection = document.getElementsByTagName('h5');

    for (let element of collection) {
        if(element.getAttribute('claaName') == 'dropdown-toggle only-current-account-ahorros') {
            cuentaSede = listaCuentas.filter(it => element.innerText.indexOf(it.Valor) > 0);
            if (cuentaSede == null || cuentaSede == '' || cuentaSede == [] || cuentaSede.length == 0) {
                alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
                return;
            }
            if (cuentaSede.length > 1) {
                alert(`Existe ${cuentaSede.length} cuentas registradas con el número de cuenta ${elem.innerText.trim()}, revisar la cuenta en las configuraciones.`);
                return;
            } else {
                cuentaSede = cuentaSede[0];
            }
        }
    }

    collection = document.getElementsByTagName('p');
    for (let element of collection) {
        if(element.getAttribute('className') == 'cont-sald-disp') {
            collectionAux = element.getElementsByTagName('strong');
            aux = collectionAux[0].innerText;
            if(aux.indexOf(cuentaSede.ParametroChar3) < 0) {
                alert("La moneda de la cuenta no corresponde a la moneda que se intenta subir");
                return;
            }
            break;
        }
    }
    
    htmlElement = document.getElementById(cuentaSede.ParametroChar1_banco);
    htmlElement = document.getElementById("table-body");

    if(htmlElement != null) {
        collection = htmlElement.getElementsByTagName('div');
        for (let elementDiv of collection) {
            aux = elementDiv.getAttribute('className');
            if(elementDiv.getAttribute('className') == 'cont-resp row-cont row-transaction') {
                let div = elementDiv.getElementsByTagName('div');
                for (let element of div) {
                    if(element.getAttribute('className') == 'list-tabl-body') {
                        detalle = {};
                        detalle.Sede = cuentaSede.sede.Id;
                        detalle.BancoId = cuentaSede.ID_banco;
                        detalle.CuentaBanco = cuentaSede.CuentaId;
                        let auxMonto;

                        elem = element.getElementsByTagName('div')[0];
                        collectionAux = elem.getElementsByTagName('p');

                        detalle.FechaOperacion = collectionAux[0].innerText;
                        detalle.FechaProceso = detalle.FechaOperacion;
                        detalle.Descripcion = collectionAux[1].innerText;
                        auxMonto = collectionAux.innerText;
                        auxMonto = auxMonto.split(' ')[1];
                        detalle.Monto = parseFloat(auxMonto);
                        detalle.NroDocumento = collectionAux[3].innerText;

                        if (detalle.Monto > 0)
                            detalle.Tipo = 1;
                        else
                            detalle.Tipo = -1;
                        
                        if(detalle.EmpresaId == 1) {
                            detalle.IdEmpresa = 2;
                        } else {
                            detalle.IdEmpresa = 1;
                        }

                        listaDetalle.push(detalle);
                    }
                }
            }
        }
        if(listaDetalle.length > 0) {
            let url = cuentaSede.Valor_banco;
            let dataMovimientos = { url: url , listaDetalle: listaDetalle };
            dataMovimientos = JSON.stringify(dataMovimientos);
            chrome.storage.sync.set({ dataMovimientos });
            alert(`${listaDetalle.length} movimientos encontrados`);
        } else {
            alert(`No se encontraron movimientos bancarios`);
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente.");
    }
}

function leerMovimientosInterbank(listaCuentas, bancoSeleccionado) {
    let collection = document.getElementsByTagName('mat-select');
    let controlRows = 0;
    let cuentaSede = [];
    let listaDetalle = [];
    for (let element of collection) {
        collection2 = element.getElementsByTagName('span');
        for(let elem of collection2) {
            aux = elem.getAttribute('className');
            if(aux.indexOf('mat-select-value-text') > -1 && aux.indexOf('ng-star-inserted') && aux.indexOf('ng-tns-c')) {
                span = elem.getElementsByTagName('span');
                for (let spanElement of span) {
                    if(cuentaSede.length != 0) {
                        cuentaSede = listaCuentas.filter(it => spanElement.innerText.indexOf(it.Valor) > -1 && spanElement.innerText.indexOf(it.ParametroChar3) > -1);
                        if(cuentaSede.length > 0) {
                            cuentaSede = cuentaSede[0];
                            break;
                        }
                    }
                }
                if(cuentaSede.length > 0) {
                    break;
                }
            }
        }
    }

    if(cuentaSede.length == 0) {
        alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
    }

    htmlElement = document.getElementsByTagName('ibk-table-body')[0];
    collection = htmlElement.getElementsByTagName('ibk-table-row');

    for (let element of collection) {
        detalle = {};
        controlRows = 0;
        classTable = element.getElementsByTagName('ibk-table-cell-content');
        for (let cellElement of classTable) {
            switch(controlRows) {
                case 0:
                    detalle.FechaOperacion = cellElement.innerText;
                    break;
                case 1:
                    detalle.FechaOperacion = cellElement.innerText;
                    break;
                case 4:
                    detalle.Descripcion = cellElement.innerText;
                    break;
                case 6:
                    splitMonto = cellElement.innerText.split(':');
                    if(splitMonto.lenght > 1) {
                        detalle.Monto = parseFloat(splitMonto[1].replace("S/", "").replace("$", "").replace(",", ""));
                    } else {
                        detalle.Monto = parseFloat(splitMonto[0].replace("S/", "").replace("$", "").replace(",", ""));
                    }
                    break;
            }
            controlRows++;
        }
        detalle.Sede = cuentaSede.sede.Id;
        detalle.BancoId = cuentaSede.ID_banco;
        detalle.CuentaBanco = cuentaSede.CuentaId;
        if (detalle.Monto > 0)
            detalle.Tipo = 1;
        else
            detalle.Tipo = -1;
        if(cuentaSede.EmpresaId == 1) {
            detalle.IdEmpresa = 2;
        } else {
            detalle.IdEmpresa = 1;
        }

        listaDetalle.push(detalle);
    }
    if(listaDetalle.length > 0) {
        let url = cuentaSede.Valor_banco;
        let dataMovimientos = { url: url , listaDetalle: listaDetalle };
        dataMovimientos = JSON.stringify(dataMovimientos);
        chrome.storage.sync.set({ dataMovimientos });
        alert(`${listaDetalle.length} movimientos encontrados`);
    } else {
        alert(`No se encontraron movimientos bancarios`);
    }
}

function leerMovimientosCajaArequipa(listaCuentas, bancoSeleccionado) {
    let listaDetalle = [];
    let htmlElement = document.getElementsByTagName("app-portal-accounts-savings")[0];
    let div = htmlElement.getElementsByTagName('div');
    for (let element of div) {
        aux = element.getAttribute('className');
        if(aux == "d-flex flex-wrap justify-content-xl-between") {
            tagDiv = element.getElementsByTagName('div');
            for (let nroCuentaElement of tagDiv) {
                aux = nroCuentaElement.getAttribute('className');
                if(aux == "mr-3 mt-2 mt-xl-0") {
                    cuentaDiv = nroCuentaElement.getElementsByTagName('div');
                    for (let cuentaElement of cuentaDiv) {
                        aux = cuentaElement.getAttribute('className');
                        if(aux == 'subtitle color-gray') {
                            cuentaSede = listaCuentas.find(it => it.Valor == cuentaElement.innerText);
                            cuentaSede = cuentaSede[0];
                            break;
                        }
                    }
                    if(cuentaSede != null) {
                        break;
                    }
                }
            }
            if(cuentaSede != null) {
                break;
            }
        }
    }
    // -> Validación de sede <-

    htmlElement = document.getElementsByTagName('history-table')[0];

    elementDiv = htmlElement.getElementsByTagName('div');
    for (let element of elementDiv) {
        aux = element.getAttribute('className');
        if(aux == "history-container px-5 py-2") {
            rowElementDiv = element.getElementsByTagName('div');
            for (let rowElement of rowElementDiv) {
                aux = rowElement.getAttribute('className');
                if(aux == "row d-lg-none py-3 item d-print-none") {
                    detalle = {};
                    collection = rowElement.getElementsByTagName('div');
                    detalle.Descripcion = '';

                    collectionDiv = collection[0].getElementsByTagName('div');
                    for (let columnElement of collectionDiv) {
                        detalle.Descripcion += columnElement.innerText;
                    }

                    let i = 3;
                    let el = collection[i];
                    collection2 = collection[i].getElementsByTagName('div');
                    detalle.Monto = parseFloat(collection2[0].innerText);
                    detalle.FechaOperacion = collection2[1].innerText;
                    detalle.FechaProceso = detalle.FechaOperacion;
                    detalle.Sede = cuentaSede.sede.Id;
                    detalle.BancoId = cuentaSede.ID_banco;
                    detalle.CuentaBanco = cuentaSede.CuentaId;
                    if(detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }
                    detalle.IdEmpresa = cuentaSede.EmpresaId;
                    listaDetalle.push(detalle);
                }
            }
        }
    }

    if(listaDetalle.length > 0) {
        let url = cuentaSede.Valor_banco;
        let dataMovimientos = { url: url , listaDetalle: listaDetalle };
        dataMovimientos = JSON.stringify(dataMovimientos);
        chrome.storage.sync.set({ dataMovimientos });
        alert(`${listaDetalle.length} movimientos encontrados`);
    } else {
        alert(`No se encontraron movimientos bancarios`);
    }
}

// ** PENDIENTE OBTENER CUENTASEDE ** //
function leerMovimientosCajaSullana(listaCuentas, bancoSeleccionado) {
    let controlColumns;
    let controlRows;
    let listaDetalle = [];
    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    collection = document.getElementsByTagName('div');
    for (const elem of collection) {
        if(elem.Id != null) {
            if(elem.Id == listaCuentas[0].ParametroChar2_banco) {
                htmlElement = elem;
            }
        }
    }

    // ************** PENDIENTE OBTENER CUENTASEDE ***************** //

    if(htmlElement != null) {
        collection = htmlElement.getElementsByTagName('div');
        htmlElement = htmlElement.getElementsByTagName('div')[1];
        collection = htmlElement.getElementsByTagName('div');
        htmlElement = htmlElement.getElementsByTagName('div')[0];
        collection = htmlElement.getElementsByTagName('div');
        htmlElement = htmlElement.getElementsByTagName('div')[0];
        collection = htmlElement.getElementsByTagName('div');
        htmlElement = htmlElement.getElementsByTagName('div')[0];
        collection = htmlElement.getElementsByTagName('div');
        htmlElement = htmlElement.getElementsByTagName('div')[1];
        collection = htmlElement.getElementsByTagName('div');

        controlColumns = 0;
        collectionDiv = collection[0].getElementsByTagName('div');
        for (const element of collectionDiv) {
            controlRows = 0;
            switch(controlColumns) {
                case 0:
                    elemDiv = element.getElementsByTagName('div');
                    for (const elem of elemDiv) {
                        switch(controlRows) {
                            case 0:
                                if(elem.getElementsByTagName('span')[0].innerText.indexOf(cuentaSede.ParametroChar3_banco) < 0) {
                                    alert('La moneda de la cuenta no corresponde a la moneda que se intenta subir');
                                    return;
                                }
                                break;
                            case 2:
                                if(elem.getElementsByTagName('span')[0].innerText.indexOf(cuentaSede.Valor) < 0) {
                                    alert('La cuenta no corresponde a la sede, seleccionar cuenta correcta y volver a cargar histórico');
                                    return;
                                }
                                break;
                        }
                        controlRows++;
                    }
                    break;
                default:
                    break;
            }
            controlColumns++;
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la pàgina cargara corretamente");
    }

    htmlElement = document.getElementById(cuentaSede.ParametroChar1_banco);
    controlRows = 0;

    if(htmlElement != null) {
        htmlElementTr = htmlElement.getElementsByTagName('tr');
        for (const element of htmlElementTr) {
            if(controlRows >= 1) {
                detalle = {};
                collection = element.getElementsByTagName('td');

                if(collection.lenght > 2) {
                    detalle.FechaOperacion = collection[0].innerText;
                    detalle.FechaProceso = detalle.FechaOperacion;
                    detalle.Descripcion = collection[1].innerText;
                    detalle.Monto = parseFloat(collection[2].innerText.split(' ')[1]);
                    detalle.Sede = cuentaSede.sede.Id;
                    detalle.BancoId = cuentaSede.ID_banco;
                    detalle.CuentaBanco = cuentaSede.CuentaId;
                    if(cuentaSede.EmpresaId == 1) {
                        detalle.IdEmpresa = 2;
                    } else {
                        detalle.IdEmpresa = 1;
                    }

                    if(detalle.Monto > 0) {
                        detalle.Tipo = 1;
                    } else {
                        detalle.Tipo = -1;
                    }

                    listaDetalle.push(detalle);
                }
            }
        }
    }

    if(listaDetalle.length > 0) {
        let url = cuentaSede.Valor_banco;
        let dataMovimientos = { url: url , listaDetalle: listaDetalle };
        dataMovimientos = JSON.stringify(dataMovimientos);
        chrome.storage.sync.set({ dataMovimientos });
        alert(`${listaDetalle.length} movimientos encontrados`);
    } else {
        alert(`No se encontraron movimientos bancarios`);
    }
}

function leerMovimientosBancoNacion(listaCuentas, bancoSeleccionado) {
    let controlColumns;
    let controlRows;
    let listaDetalle = [];
    let cuentaSede = [];
    if(listaCuentas == null || listaCuentas == '' || listaCuentas == [] || listaCuentas.length == 0) {
        alert("La cuenta no se encuentra registrada, registrar la cuenta en las configuraciones.");
        return;
    }

    htmlElement = window.frames[0].document.getElementById(listaCuentas[0].ParametroChar1_banco);
    if(htmlElement != null) {
        collection = htmlElement.getElementsByTagName('table');
        controlRows = 0;
        for (const tableElement of collection) {
            let aux = tableElement.getAttribute('className');
            if(tableElement.getAttribute('className') == cuentaSede[0].ParametroChar3_banco) {
                tr = tableElement.getElementsByTagName('tr');
                for (const element of tr) {
                    controlColumns = 0;
                    switch(controlRows) {
                        case 2:
                            let td = element.getElementsByTagName('td');
                            for (const elem of td) {
                                if(controlColumns == 1) {
                                    cuentaSede = cuentaSede.filter(it => it.Valor == elem.innerText.substring(0, it.Valor.lenght) && it.sede.Id == '98');
                                    if(cuentaSede.lenght > 0) {
                                        break;
                                    }
                                }
                                controlColumns++;
                            }
                            if(cuentaSede.lenght < 1) {
                                alert("No se encontró cuenta con empresa y banco seleccionado, registrar la cuenta en las configuraciones.");
                                return;
                            } else if (cuentaSede.length > 1) {
                                alert(`Existe ${cuentaSede.length} cuentas registradas con el número de cuenta ${elem.innerText.trim().substring(0, 16)}, revisar la cuenta en las configuraciones.`);
                                return;
                            } else {
                                cuentaSede = cuentaSede[0];
                            }
                            break;
                        case 3:
                            td = element.getElementsByTagName('td');
                            for (const elem of td) {
                                if(controlColumns == 1) {
                                    if(cuentaSede.ParametroChar3 != elem.innerText.trim()) {
                                        alert("La moneda de la cuenta no correspone a la moneda que intenta subir");
                                        return;
                                    }
                                }
                                controlColumns++;
                            }
                            break;
                        default:
                            break;
                    }
                    controlRows++;
                }
            }
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la pàgina cargara correctamente");
    }

    htmlElement = window.frames[0].document.getElementById(cuentaSede.ParametroChar1_banco);
    controlRows = 0;
    if(htmlElement != null) {
        collection = htmlElement.getElementsByTagName('table');
        for (const tableElement of collection) {
            let aux = tableElement.getAttribute('className');
            if(tableElement.getAttribute('className') == listaCuenta.ParametroChar2_banco) {
                htmlElement = tableElement.getElementsByTagName('tbody')[0];
                tr = htmlElement.getElementsByTagName('tr');
                for (const element of tr) {
                    detalle = {};
                    collection = element.getElementsByTagName('td');
                    if(collection.lenght > 2) {
                        try {
                            detalle.FechaOperacion = collection[1].innerText;
                        } catch (error) {
                            let strSplit = collection[1].innerText.split('.');
                            detalle.FechaOperacion = `${ strSplit[0] }/${ strSplit[1] }/${ strSplit[2] }`;
                        }
                        detalle.FechaProceso = detalle.FechaOperacion;
                        detalle.Descripcion = collection[2].innerText;
                        detalle.NroOperacion = collection[3].innerText;
                        if(detalle.NroOperacion == '00000000') {
                            detalle.NroOperacion = null;
                        }
                        try {
                            detalle.Monto = parseFloat(collection[5].innerText);
                        } catch (error) {
                            detalle.Monto = parseFloat(collection[6].innerText);                            
                        }
                        if(detalle.Monto == 0) {
                            detalle.Monto = parseFloat(collection[6].innerText);
                        }
                        detalle.Sede = cuentaSede.sede.Id;
                        detalle.BancoId = cuentaSede.ID_banco;
                        detalle.CuentaBanco = cuentaSede.CuentaId;
                        if(cuentaSede.EmpresaId == 1) {
                            detalle.IdEmpresa = 2;
                        } else {
                            detalle.IdEmpresa = 1;
                        }
                        if(detalle.Monto > 0) {
                            detalle.Tipo = 1;
                        } else {
                            detalle.Tipo = -1;
                        }

                        listaDetalle.push(detalle);
                    } else {
                        break;
                    }
                    controlRows++;
                }
            }
        }
        if(listaDetalle.length > 0) {
            let url = cuentaSede.Valor_banco;
            let dataMovimientos = { url: url , listaDetalle: listaDetalle };
            dataMovimientos = JSON.stringify(dataMovimientos);
            chrome.storage.sync.set({ dataMovimientos });
            alert(`${listaDetalle.length} movimientos encontrados`);
        } else {
            alert(`No se encontraron movimientos bancarios`);
        }
    } else {
        alert("Tabla de búsqueda no encontrada, verificar que la página cargara correctamente");
    }
}