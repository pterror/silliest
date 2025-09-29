// current as of https://github.com/sindresorhus/file-type/commit/fd1e72c8624018fe67a50edcd1557f153260cdca
/// <reference lib="es2020" />

// NOTE: added formats: elf, xcf

const dec = new TextDecoder("utf8");
function decode(s: AllowSharedBufferSource) {
  try {
    return dec.decode(s);
  } catch {
    return "";
  }
}

export function fileType(
  buffer: Uint8Array,
): readonly [extension: string, mimetype: string] | undefined {
  let pos = 0;
  const view = new DataView(buffer.buffer);
  function _check(
    buffer: Uint8Array,
    headers: readonly number[] | Uint8Array,
    offset = 0,
    mask: readonly number[] | undefined = undefined,
  ) {
    for (let i = 0; i < headers.length; i++) {
      const byte = buffer[pos + i + offset] ?? 0;
      if (headers[i] !== ((mask?.[i] ?? 0xff) & byte)) {
        return false;
      }
    }
    return true;
  }
  const check = (
    header: readonly number[],
    offset = 0,
    mask: readonly number[] | undefined = undefined,
  ) => _check(buffer, header, offset, mask);
  const checkString = (
    header: string,
    offset = 0,
    mask: readonly number[] | undefined = undefined,
  ) =>
    _check(
      buffer,
      [...header].map((c) => c.charCodeAt(0)),
      offset,
      mask,
    );

  // -- 2-byte signatures --

  if (check([0x42, 0x4d])) {
    return ["bmp", "image/bmp"] as const;
  }

  if (check([0x0b, 0x77])) {
    return ["ac3", "audio/vnd.dolby.dd-raw"] as const;
  }

  if (check([0x78, 0x01])) {
    return ["dmg", "application/x-apple-diskimage"] as const;
  }

  if (check([0x4d, 0x5a])) {
    return ["exe", "application/x-msdownload"] as const;
  }

  if (check([0x25, 0x21])) {
    if (checkString("PS-Adobe-", 2) && checkString(" EPSF-", 14)) {
      return ["eps", "application/eps"] as const;
    }

    return ["ps", "application/postscript"] as const;
  }

  if (check([0x1f, 0xa0]) || check([0x1f, 0x9d])) {
    return ["Z", "application/x-compress"] as const;
  }

  // -- 3-byte signatures --

  if (check([0xff, 0xd8, 0xff])) {
    return ["jpg", "image/jpeg"] as const;
  }

  if (check([0x49, 0x49, 0xbc])) {
    return ["jxr", "image/vnd.ms-photo"] as const;
  }

  if (check([0x1f, 0x8b, 0x8])) {
    return ["gz", "application/gzip"] as const;
  }

  if (check([0x42, 0x5a, 0x68])) {
    return ["bz2", "application/x-bzip2"] as const;
  }

  if (checkString("ID3")) {
    pos += 6; // Skip ID3 header until the header size
    const n = view.getUint32(pos);
    pos += 4;
    // XXX: check
    const id3HeaderLen =
      (n & 0x7f) |
      (((n >> 8) & 0xff) << 7) |
      (((n >> 16) & 0xff) << 14) |
      (((n >> 24) & 0xff) << 21);
    if (pos + id3HeaderLen > buffer.length) {
      // Guess file type based on ID3 header for backward compatibility
      return ["mp3", "audio/mpeg"] as const;
    }

    pos += id3HeaderLen;
    return fileType(buffer.slice(pos)); // Skip ID3 header, recursion
  }

  // Musepack, SV7
  if (checkString("MP+")) {
    return ["mpc", "audio/x-musepack"] as const;
  }

  if ((buffer[0] === 0x43 || buffer[0] === 0x46) && check([0x57, 0x53], 1)) {
    return ["swf", "application/x-shockwave-flash"] as const;
  }

  // -- 4-byte signatures --

  if (check([0x47, 0x49, 0x46])) {
    return ["gif", "image/gif"] as const;
  }

  if (checkString("FLIF")) {
    return ["flif", "image/flif"] as const;
  }

  if (checkString("8BPS")) {
    return ["psd", "image/vnd.adobe.photoshop"] as const;
  }

  if (checkString("WEBP", 8)) {
    return ["webp", "image/webp"] as const;
  }

  // Musepack, SV8
  if (checkString("MPCK")) {
    return ["mpc", "audio/x-musepack"] as const;
  }

  if (checkString("FORM")) {
    return ["aif", "audio/aiff"] as const;
  }

  if (checkString("icns", 0)) {
    return ["icns", "image/icns"] as const;
  }

  // Zip-based file formats
  // Need to be before the `zip` check
  if (check([0x50, 0x4b, 0x3, 0x4])) {
    // Local file header signature
    while (pos + 30 < buffer.length) {
      // https://en.wikipedia.org/wiki/Zip_(file_format)#File_headers
      const compressedSize = view.getUint32(pos + 18),
        uncompressedSize = view.getUint32(pos + 22),
        filenameLength = view.getUint32(pos + 26),
        extraFieldLength = view.getUint32(pos + 28);
      let filename;
      pos += 30;

      filename = decode(buffer.slice(pos, pos + filenameLength));
      pos += filenameLength;
      pos += extraFieldLength;

      // Assumes signed `.xpi` from addons.mozilla.org
      if (filename === "META-INF/mozilla.rsa") {
        return ["xpi", "application/x-xpinstall"] as const;
      }

      if (filename.endsWith(".rels") || filename.endsWith(".xml")) {
        const type = filename.split("/")[0];
        switch (type) {
          case "_rels":
            break;
          case "word":
            return [
              "docx",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
          case "ppt":
            return [
              "pptx",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ];
          case "xl":
            return [
              "xlsx",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];
          default:
            break;
        }
      }

      if (filename.startsWith("xl/")) {
        return [
          "xlsx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
      }

      if (/^3D\/.+\.model$/.test(filename)) {
        return ["3mf", "model/3mf"] as const;
      }

      // The docx, xlsx and pptx file types extend the Office Open XML file format:
      // https://en.wikipedia.org/wiki/Office_Open_XML_file_formats
      // We look for:
      // - one entry named '[Content_Types].xml' or '_rels/.rels',
      // - one entry indicating specific type of file.
      // MS Office, OpenOffice and LibreOffice may put the parts in different order, so the check should not rely on it.
      if (filename === "mimetype" && compressedSize === uncompressedSize) {
        const mimeType = decode(buffer.slice(pos, (pos += compressedSize)));
        let ext;
        const od = "application/vnd.oasis.opendocument.";
        switch (mimeType) {
          case "application/epub+zip":
            ext = "epub";
            break;
          case `${od}text`:
            ext = "odt";
            break;
          case `${od}spreadsheet`:
            ext = "ods";
            break;
          case `${od}presentation`:
            ext = "odp";
            break;
        }
        if (ext) {
          return [ext, mimeType] as const;
        }
      }

      // Try to find next header manually when current one is corrupted
      if (!compressedSize) {
        // Move position to the next header if found, skip the whole buffer otherwise
        while (pos + 4 < buffer.length && view.getUint32(pos) != 0x504b0304) {
          pos++;
        }
      } else {
        pos += compressedSize;
      }
    }

    return ["zip", "application/zip"] as const;
  }

  if (checkString("OggS")) {
    // This is an OGG container
    pos += 28;
    const type = buffer.slice(pos, pos + 8);

    // Needs to be before `ogg` check
    if (_check(type, [0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64])) {
      return ["opus", "audio/opus"] as const;
    }

    // If ' theora' in header.
    if (_check(type, [0x80, 0x74, 0x68, 0x65, 0x6f, 0x72, 0x61])) {
      return ["ogv", "video/ogg"] as const;
    }

    // If '\x01video' in header.
    if (_check(type, [0x01, 0x76, 0x69, 0x64, 0x65, 0x6f, 0x00])) {
      return ["ogm", "video/ogg"] as const;
    }

    // If ' FLAC' in header  https://xiph.org/flac/faq.html
    if (_check(type, [0x7f, 0x46, 0x4c, 0x41, 0x43])) {
      return ["oga", "audio/ogg"] as const;
    }

    // 'Speex  ' in header https://en.wikipedia.org/wiki/Speex
    if (_check(type, [0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20])) {
      return ["spx", "audio/ogg"] as const;
    }

    // If '\x01vorbis' in header
    if (_check(type, [0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73])) {
      return ["ogg", "audio/ogg"] as const;
    }

    // Default OGG container https://www.iana.org/assignments/media-types/application/ogg
    return ["ogx", "application/ogg"] as const;
  }

  if (
    check([0x50, 0x4b]) &&
    (buffer[2] === 0x3 || buffer[2] === 0x5 || buffer[2] === 0x7) &&
    (buffer[3] === 0x4 || buffer[3] === 0x6 || buffer[3] === 0x8)
  ) {
    return ["zip", "application/zip"] as const;
  }

  // File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
  // It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
  // `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
  // Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
  if (
    checkString("ftyp", 4) &&
    ((buffer[8] ?? 0) & 0x60) !== 0x00 // Brand major, first character ASCII?
  ) {
    // They all can have MIME `video/mp4` except `application/mp4` special-case which is hard to detect.
    // For some cases, we're specific, everything else falls to `video/mp4` with `mp4` extension.
    // oxlint-disable-next-line no-control-regex
    const brandMajor = decode(buffer.slice(8, 12)).replace(/\0/g, " ").trim();
    switch (brandMajor) {
      case "avif":
        return ["avif", "image/avif"] as const;
      case "mif1":
        return ["heic", "image/heif"] as const;
      case "msf1":
        return ["heic", "image/heif-sequence"] as const;
      case "heic":
      case "heix":
        return ["heic", "image/heic"] as const;
      case "hevc":
      case "hevx":
        return ["heic", "image/heic-sequence"] as const;
      case "qt":
        return ["mov", "video/quicktime"] as const;
      case "M4V":
      case "M4VH":
      case "M4VP":
        return ["m4v", "video/x-m4v"] as const;
      case "M4P":
        return ["m4p", "video/mp4"] as const;
      case "M4B":
        return ["m4b", "audio/mp4"] as const;
      case "M4A":
        return ["m4a", "audio/x-m4a"] as const;
      case "F4V":
        return ["f4v", "video/mp4"] as const;
      case "F4P":
        return ["f4p", "video/mp4"] as const;
      case "F4A":
        return ["f4a", "audio/mp4"] as const;
      case "F4B":
        return ["f4b", "audio/mp4"] as const;
      case "crx":
        return ["cr3", "image/x-canon-cr3"] as const;
    }
    return brandMajor.startsWith("3g2")
      ? ["3g2", "video/3gpp2"]
      : brandMajor.startsWith("3g")
      ? ["3gp", "video/3gpp"]
      : ["mp4", "video/mp4"];
  }

  if (checkString("MThd")) {
    return ["mid", "audio/midi"] as const;
  }

  if (
    checkString("wOFF") &&
    (check([0x00, 0x01, 0x00, 0x00], 4) || checkString("OTTO", 4))
  ) {
    return ["woff", "font/woff"] as const;
  }

  if (
    checkString("wOF2") &&
    (check([0x00, 0x01, 0x00, 0x00], 4) || checkString("OTTO", 4))
  ) {
    return ["woff2", "font/woff2"] as const;
  }

  if (check([0xd4, 0xc3, 0xb2, 0xa1]) || check([0xa1, 0xb2, 0xc3, 0xd4])) {
    return ["pcap", "application/vnd.tcpdump.pcap"] as const;
  }

  // Sony DSD Stream File (DSF)
  if (checkString("DSD ")) {
    return ["dsf", "audio/x-dsf"] as const; // non-standard
  }

  if (checkString("LZIP")) {
    return ["lz", "application/x-lzip"] as const;
  }

  if (checkString("fLaC")) {
    return ["flac", "audio/x-flac"] as const;
  }

  if (check([0x42, 0x50, 0x47, 0xfb])) {
    return ["bpg", "image/bpg"] as const;
  }

  if (checkString("wvpk")) {
    return ["wv", "audio/wavpack"] as const;
  }

  if (checkString("%PDF")) {
    pos += 1350;

    // Check if this is an Adobe Illustrator file
    let pos2 = pos;
    while (pos2 + 13 < buffer.length) {
      // 'AIPrivateData'
      if (
        view.getUint32(pos2) == 0x41495072 &&
        view.getUint32(pos2 + 4) == 0x69766174 &&
        view.getUint32(pos2 + 8) == 0x65446174 &&
        view.getUint8(pos2 + 12) == 0x61
      ) {
        return ["ai", "application/postscript"] as const;
      }
      pos2++;
    }

    // Assume this is just a normal PDF
    return ["pdf", "application/pdf"] as const;
  }

  if (check([0x00, 0x61, 0x73, 0x6d])) {
    return ["wasm", "application/wasm"] as const;
  }

  // TIFF, little-endian type
  if (check([0x49, 0x49, 0x2a, 0x0])) {
    if (checkString("CR", 8)) {
      return ["cr2", "image/x-canon-cr2"] as const;
    }

    if (
      check([0x1c, 0x00, 0xfe, 0x00], 8) ||
      check([0x1f, 0x00, 0x0b, 0x00], 8)
    ) {
      return ["nef", "image/x-nikon-nef"] as const;
    }

    if (
      check([0x08, 0x00, 0x00, 0x00], 4) &&
      (check([0x2d, 0x00, 0xfe, 0x00], 8) || check([0x27, 0x00, 0xfe, 0x00], 8))
    ) {
      return ["dng", "image/x-adobe-dng"] as const;
    }

    if (
      (check([0x10, 0xfb, 0x86, 0x01], 4) ||
        check([0x08, 0x00, 0x00, 0x00], 4)) &&
      // This pattern differentiates ARW from other TIFF-ish file types:
      check(
        [
          0x00, 0xfe, 0x00, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
          0x00, 0x00, 0x03, 0x01,
        ],
        9,
      )
    ) {
      return ["arw", "image/x-sony-arw"] as const;
    }

    return ["tif", "image/tiff"] as const;
  }

  // TIFF, big-endian type
  if (check([0x4d, 0x4d, 0x0, 0x2a])) {
    return ["tif", "image/tiff"] as const;
  }

  if (checkString("MAC ")) {
    return ["ape", "audio/ape"] as const;
  }

  // https://github.com/threatstack/libmagic/blob/master/magic/Magdir/matroska
  if (check([0x1a, 0x45, 0xdf, 0xa3])) {
    // Root element: EBML
    function readField() {
      const msb = buffer[pos] ?? 0;
      let mask = 0x80;
      let ic = 0; // 0 = A, 1 = B, 2 = C, 3 = D
      while ((msb & mask) === 0) {
        ++ic;
        mask >>= 1;
      }
      return buffer.slice(pos, pos + ic + 1);
    }

    function readElement() {
      const id = readField();
      const len = readField();
      len[0] = (len[0] ?? 0) ^ (0x80 >> (len.length - 1));
      function read(buf: Uint8Array) {
        let ret = 0n;
        for (let i = 0; i < buf.length; i += 1) {
          ret = (ret << 8n) | BigInt(buf[i] ?? 0);
        }
        return BigInt(Number(ret)) === ret ? Number(ret) : ret;
      }
      return [read(id), read(len)] as const;
    }

    function readChildren(children: number) {
      while (children > 0) {
        const e = readElement();
        if (e[0] === 0x4282) {
          return decode(buffer.slice(pos, pos + Number(e[1] ?? 0)));
        } // Return DocType
        pos += Number(e[1]);
        children -= 1;
      }
    }

    const re = readElement();
    const docType = readChildren(Number(re[1] ?? 0));

    switch (docType) {
      case "webm":
        return ["webm", "video/webm"] as const;

      case "matroska":
        return ["mkv", "video/x-matroska"] as const;

      default:
        return;
    }
  }

  // RIFF file format which might be AVI, WAV, QCP, etc
  if (check([0x52, 0x49, 0x46, 0x46])) {
    if (check([0x41, 0x56, 0x49], 8)) {
      return ["avi", "video/vnd.avi"] as const;
    }

    if (check([0x57, 0x41, 0x56, 0x45], 8)) {
      return ["wav", "audio/vnd.wave"] as const;
    }

    // QLCM, QCP file
    if (check([0x51, 0x4c, 0x43, 0x4d], 8)) {
      return ["qcp", "audio/qcelp"] as const;
    }
  }

  if (checkString("SQLi")) {
    return ["sqlite", "application/x-sqlite3"] as const;
  }

  if (check([0x4e, 0x45, 0x53, 0x1a])) {
    return ["nes", "application/x-nintendo-nes-rom"] as const;
  }

  if (checkString("Cr24")) {
    return ["crx", "application/x-google-chrome-extension"] as const;
  }

  if (checkString("MSCF") || checkString("ISc(")) {
    return ["cab", "application/vnd.ms-cab-compressed"] as const;
  }

  if (check([0xed, 0xab, 0xee, 0xdb])) {
    return ["rpm", "application/x-rpm"] as const;
  }

  if (check([0xc5, 0xd0, 0xd3, 0xc6])) {
    return ["eps", "application/eps"] as const;
  }

  if (check([0x28, 0xb5, 0x2f, 0xfd])) {
    return ["zst", "application/zstd"] as const;
  }

  // -- 5-byte signatures --

  if (check([0x4f, 0x54, 0x54, 0x4f, 0x00])) {
    return ["otf", "font/otf"] as const;
  }

  if (checkString("#!AMR")) {
    return ["amr", "audio/amr"] as const;
  }

  if (checkString("{\\rtf")) {
    return ["rtf", "application/rtf"] as const;
  }

  if (check([0x46, 0x4c, 0x56, 0x01])) {
    return ["flv", "video/x-flv"] as const;
  }

  if (checkString("IMPM")) {
    return ["it", "audio/x-it"] as const;
  }

  if (check([0x7f, 0x45, 0x4c, 0x46])) {
    return ["", "application/x-elf"] as const;
  }

  if (
    [
      "h0",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "h7",
      "zs",
      "z4",
      "z5",
      "hd",
    ].some((s) => checkString(`-l${s}-`, 2))
  ) {
    return ["lzh", "application/x-lzh-compressed"] as const;
  }

  // MPEG program stream (PS or MPEG-PS)
  if (check([0x00, 0x00, 0x01, 0xba])) {
    //  MPEG-PS, MPEG-1 Part 1
    if (check([0x21], 4, [0xf1])) {
      return ["mpg", "video/MP1S"] as const; // May also be .ps, .mpeg
    }

    // MPEG-PS, MPEG-2 Part 1
    if (check([0x44], 4, [0xc4])) {
      return ["mpg", "video/MP2P"] as const; // May also be .mpeg, .m2p, .vob or .sub
    }
  }

  if (checkString("ITSF")) {
    return ["chm", "application/vnd.ms-htmlhelp"] as const;
  }

  // -- 6-byte signatures --

  if (check([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) {
    return ["xz", "application/x-xz"] as const;
  }

  if (checkString("<?xml ")) {
    return ["xml", "application/xml"] as const;
  }

  if (checkString("BEGIN:")) {
    return ["ics", "text/calendar"] as const;
  }

  if (check([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return ["7z", "application/x-7z-compressed"] as const;
  }

  if (
    check([0x52, 0x61, 0x72, 0x21, 0x1a, 0x7]) &&
    (buffer[6] == 0x0 || buffer[6] == 0x1)
  ) {
    return ["rar", "application/x-rar-compressed"] as const;
  }

  if (checkString("solid ")) {
    return ["stl", "model/stl"] as const;
  }

  // -- 7-byte signatures --

  if (checkString("BLENDER")) {
    return ["blend", "application/x-blender"] as const;
  }

  if (checkString("!<arch>")) {
    pos += 8;
    const str = decode(buffer.slice(pos, pos + 13));
    if (str === "debian-binary") {
      return ["deb", "application/x-deb"] as const;
    }

    return ["ar", "application/x-unix-archive"] as const;
  }

  // -- 8-byte signatures --

  if (check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    // APNG format (https://wiki.mozilla.org/APNG_Specification)
    // 1. Find the first IDAT (image data) chunk (49 44 41 54)
    // 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

    // Offset calculated as follows:
    // - 8 bytes: PNG signature
    // - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk

    pos += 8; // ignore PNG signature

    function readChunkHeader() {
      return [
        ((pos += 4), view.getInt32(pos - 4)),
        ((pos += 4), decode(buffer.slice(pos - 4, pos))),
      ] as const;
    }

    do {
      const [length, type] = readChunkHeader();
      if (length < 0) {
        return; // Invalid chunk length
      }

      switch (type) {
        case "IDAT":
          return ["png", "image/png"] as const;
        case "acTL":
          return ["apng", "image/apng"] as const;
        default:
          pos += length + 4; // Ignore chunk-data + CRC
      }
    } while (pos + 8 < buffer.length);

    return ["png", "image/png"] as const;
  }

  if (check([0x41, 0x52, 0x52, 0x4f, 0x57, 0x31, 0x00, 0x00])) {
    return ["arrow", "application/x-apache-arrow"] as const;
  }

  if (check([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])) {
    return ["glb", "model/gltf-binary"] as const;
  }

  if (checkString("gimp xcf ")) {
    return ["xcf", "image/x-xcf"] as const;
  }

  // `mov` format variants
  if (
    check([0x66, 0x72, 0x65, 0x65], 4) || // `free`
    check([0x6d, 0x64, 0x61, 0x74], 4) || // `mdat` MJPEG
    check([0x6d, 0x6f, 0x6f, 0x76], 4) || // `moov`
    check([0x77, 0x69, 0x64, 0x65], 4) // `wide`
  ) {
    return ["mov", "video/quicktime"] as const;
  }

  // -- 9-byte signatures --

  if (check([0x49, 0x49, 0x52, 0x4f, 0x08, 0x00, 0x00, 0x00, 0x18])) {
    return ["orf", "image/x-olympus-orf"] as const;
  }

  // -- 12-byte signatures --

  if (
    check([
      0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xe7, 0x74, 0xd8,
    ])
  ) {
    return ["rw2", "image/x-panasonic-rw2"] as const;
  }

  // ASF_Header_Object first 80 bytes
  if (check([0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9])) {
    function readHeader() {
      return [
        buffer.slice(pos, (pos += 16)),
        ((pos += 8), view.getBigUint64(pos - 8, true)),
      ] as const;
    }

    pos += 30;
    // Search for header should be in first 1KB of file.
    while (pos + 24 < buffer.length) {
      const header = readHeader();
      let payload = Number(header[1]) - 24;
      if (
        _check(
          header[0],
          [
            0x91, 0x07, 0xdc, 0xb7, 0xb7, 0xa9, 0xcf, 0x11, 0x8e, 0xe6, 0x00,
            0xc0, 0x0c, 0x20, 0x53, 0x65,
          ],
        )
      ) {
        // Sync on Stream-Properties-Object (B7DC0791-A9B7-11CF-8EE6-00C00C205365)
        const typeId = buffer.slice(pos, (pos += 16));
        payload -= 16;
        if (
          _check(
            typeId,
            [
              0x40, 0x9e, 0x69, 0xf8, 0x4d, 0x5b, 0xcf, 0x11, 0xa8, 0xfd, 0x00,
              0x80, 0x5f, 0x5c, 0x44, 0x2b,
            ],
          )
        ) {
          // Found audio:
          return ["asf", "audio/x-ms-asf"] as const;
        }
        if (
          _check(
            typeId,
            [
              0xc0, 0xef, 0x19, 0xbc, 0x4d, 0x5b, 0xcf, 0x11, 0xa8, 0xfd, 0x00,
              0x80, 0x5f, 0x5c, 0x44, 0x2b,
            ],
          )
        ) {
          // Found video:
          return ["asf", "video/x-ms-asf"] as const;
        }
        break;
      }
      pos += payload;
    }
    // Default to ASF generic extension
    return ["asf", "application/vnd.ms-asf"] as const;
  }

  if (
    check([
      0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
    ])
  ) {
    return ["ktx", "image/ktx"] as const;
  }

  if (
    (check([0x7e, 0x10, 0x04]) || check([0x7e, 0x18, 0x04])) &&
    check([0x30, 0x4d, 0x49, 0x45], 4)
  ) {
    return ["mie", "application/x-mie"] as const;
  }

  if (
    check(
      [0x27, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      2,
    )
  ) {
    return ["shp", "application/x-esri-shape"] as const;
  }

  if (
    check([
      0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
    ])
  ) {
    // JPEG-2000 family

    pos += 20;
    const type = decode(buffer.slice(pos, pos + 4));
    pos += 4;
    switch (type) {
      case "jp2 ":
        return ["jp2", "image/jp2"] as const;
      case "jpx ":
        return ["jpx", "image/jpx"] as const;
      case "jpm ":
        return ["jpm", "image/jpm"] as const;
      case "mjp2":
        return ["mj2", "image/mj2"] as const;
      default:
        return;
    }
  }

  if (checkString("<!DOCTYPE html>") || checkString("<!doctype html>")) {
    return ["html", "text/html"] as const;
  }

  // -- Unsafe signatures --

  if (check([0x0, 0x0, 0x1, 0xba]) || check([0x0, 0x0, 0x1, 0xb3])) {
    return ["mpg", "video/mpeg"] as const;
  }

  if (check([0x00, 0x01, 0x00, 0x00, 0x00])) {
    return ["ttf", "font/ttf"] as const;
  }

  if (check([0x00, 0x00, 0x01, 0x00])) {
    return ["ico", "image/x-icon"] as const;
  }

  if (check([0x00, 0x00, 0x02, 0x00])) {
    return ["cur", "image/x-icon"] as const;
  }

  if (check([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    // Detected Microsoft Compound File Binary File (MS-CFB) Format.
    return ["cfb", "application/x-cfb"] as const;
  }

  // `raf` is here just to keep all the raw image detectors together.
  if (checkString("FUJIFILMCCD-RAW")) {
    return ["raf", "image/x-fujifilm-raf"] as const;
  }

  if (checkString("Extended Module:")) {
    return ["xm", "audio/x-xm"] as const;
  }

  if (checkString("Creative Voice File")) {
    return ["voc", "audio/x-voc"] as const;
  }

  if (check([0x04, 0x00, 0x00, 0x00]) && buffer.length >= pos + 16) {
    // Rough & quick check Pickle/ASAR
    const jsonSize = view.getUint32(pos + 12, true);
    if (buffer.length >= pos + jsonSize + 16) {
      try {
        const header = decode(view.buffer.slice(pos + 16, pos + jsonSize + 16));
        const json = JSON.parse(header);
        // Check if Pickle is ASAR
        if (json.files) {
          // Final check, assuring Pickle/ASAR format
          return ["asar", "application/x-asar"] as const;
        }
      } catch {}
    }
  }

  if (
    check([
      0x06, 0x0e, 0x2b, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0d, 0x01, 0x02, 0x01,
      0x01, 0x02,
    ])
  ) {
    return ["mxf", "application/mxf"] as const;
  }

  if (checkString("SCRM", 44)) {
    return ["s3m", "audio/x-s3m"] as const;
  }

  if (check([0x47], 4) && (check([0x47], 192) || check([0x47], 196))) {
    return ["mts", "video/mp2t"] as const;
  }

  if (check([0x42, 0x4f, 0x4f, 0x4b, 0x4d, 0x4f, 0x42, 0x49], 60)) {
    return ["mobi", "application/x-mobipocket-ebook"] as const;
  }

  if (check([0x44, 0x49, 0x43, 0x4d], 128)) {
    return ["dcm", "application/dicom"] as const;
  }

  if (
    check([
      0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
    ])
  ) {
    return ["lnk", "application/x.ms.shortcut"] as const; // Invented by us
  }

  if (
    check([
      0x62, 0x6f, 0x6f, 0x6b, 0x00, 0x00, 0x00, 0x00, 0x6d, 0x61, 0x72, 0x6b,
      0x00, 0x00, 0x00, 0x00,
    ])
  ) {
    return ["alias", "application/x.apple.alias"] as const; // Invented by us
  }

  if (
    check([0x4c, 0x50], 34) &&
    (check([0x00, 0x00, 0x01], 8) ||
      check([0x01, 0x00, 0x02], 8) ||
      check([0x02, 0x00, 0x02], 8))
  ) {
    return ["eot", "application/vnd.ms-fontobject"] as const;
  }

  if (
    check([
      0x06, 0x06, 0xed, 0xf5, 0xd8, 0x1d, 0x46, 0xe5, 0xbd, 0x31, 0xef, 0xe7,
      0xfe, 0x74, 0xb7, 0x1d,
    ])
  ) {
    return ["indd", "application/x-indesign"] as const;
  }

  let sum =
    parseInt(
      // oxlint-disable-next-line no-control-regex
      decode(view.buffer.slice(148, 154)).replace(/\0.*$/, "").trim(),
      8,
    ) - 256;
  if (!isNaN(sum)) {
    for (let i = 0; i < 148; i++) {
      sum -= buffer[i] ?? 0;
    }
    for (let i = 156; i < 512; i++) {
      sum -= buffer[i] ?? 0;
    }
    if (!sum) {
      return ["tar", "application/x-tar"] as const;
    }
  }

  if (
    check([
      0xff, 0xfe, 0xff, 0x0e, 0x53, 0x00, 0x6b, 0x00, 0x65, 0x00, 0x74, 0x00,
      0x63, 0x00, 0x68, 0x00, 0x55, 0x00, 0x70, 0x00, 0x20, 0x00, 0x4d, 0x00,
      0x6f, 0x00, 0x64, 0x00, 0x65, 0x00, 0x6c, 0x00,
    ])
  ) {
    return ["skp", "application/vnd.sketchup.skp"] as const;
  }

  if (checkString("-----BEGIN PGP MESSAGE-----")) {
    return ["pgp", "application/pgp-encrypted"] as const;
  }

  // Check MPEG 1 or 2 Layer 3 header, or 'layer 0' for ADTS (MPEG sync-word 0xFFE)
  if (buffer.length >= 2 && check([0xff, 0xe0], 0, [0xff, 0xe0])) {
    if (check([0x10], 1, [0x16])) {
      // Check for (ADTS) MPEG-2
      if (check([0x08], 1, [0x08])) {
        return ["aac", "audio/aac"] as const;
      }

      // Must be (ADTS) MPEG-4
      return ["aac", "audio/aac"] as const;
    }

    // MPEG 1 or 2 Layer 3 header
    // Check for MPEG layer 3
    if (check([0x02], 1, [0x06])) {
      return ["mp3", "audio/mpeg"] as const;
    }

    // Check for MPEG layer 2
    if (check([0x04], 1, [0x06])) {
      return ["mp2", "audio/mpeg"] as const;
    }

    // Check for MPEG layer 1
    if (check([0x06], 1, [0x06])) {
      return ["mp1", "audio/mpeg"] as const;
    }
  }
}
