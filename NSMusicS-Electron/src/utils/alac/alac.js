;(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == 'function' && require
        if (!u && a) return a(o, !0)
        if (i) return i(o, !0)
        throw new Error("Cannot find module '" + o + "'")
      }
      var f = (n[o] = {
        exports: {},
      })
      t[o][0].call(
        f.exports,
        function (e) {
          var n = t[o][1][e]
          return s(n ? n : e)
        },
        f,
        f.exports,
        e,
        t,
        n,
        r
      )
    }
    return n[o].exports
  }
  var i = typeof require == 'function' && require
  for (var o = 0; o < r.length; o++) s(r[o])
  return s
})(
  {
    1: [
      function (require, module, exports) {
        ;(function () {
          var Aglib
          Aglib = (function () {
            var BITOFF,
              KB0,
              MAX_DATATYPE_BITS_16,
              MAX_PREFIX_16,
              MAX_PREFIX_32,
              MAX_RUN_DEFAULT,
              MB0,
              MDENSHIFT,
              MMULSHIFT,
              MOFF,
              N_MAX_MEAN_CLAMP,
              N_MEAN_CLAMP_VAL,
              PB0,
              QB,
              QBSHIFT,
              dyn_get_16,
              dyn_get_32,
              lead

            function Aglib() {}
            PB0 = 40
            MB0 = 10
            KB0 = 14
            MAX_RUN_DEFAULT = 255
            MAX_PREFIX_16 = 9
            MAX_PREFIX_32 = 9
            QBSHIFT = 9
            QB = 1 << QBSHIFT
            MMULSHIFT = 2
            MDENSHIFT = QBSHIFT - MMULSHIFT - 1
            MOFF = 1 << (MDENSHIFT - 2)
            N_MAX_MEAN_CLAMP = 0xffff
            N_MEAN_CLAMP_VAL = 0xffff
            MMULSHIFT = 2
            BITOFF = 24
            MAX_DATATYPE_BITS_16 = 16
            lead = function (input) {
              var curbyte, output
              output = 0
              curbyte = 0
              while (true) {
                curbyte = input >>> 24
                if (curbyte) {
                  break
                }
                output += 8
                curbyte = input >>> 16
                if (curbyte & 0xff) {
                  break
                }
                output += 8
                curbyte = input >>> 8
                if (curbyte & 0xff) {
                  break
                }
                output += 8
                curbyte = input
                if (curbyte & 0xff) {
                  break
                }
                output += 8
                return output
              }
              if (curbyte & 0xf0) {
                curbyte >>>= 4
              } else {
                output += 4
              }
              if (curbyte & 0x8) {
                return output
              }
              if (curbyte & 0x4) {
                return output + 1
              }
              if (curbyte & 0x2) {
                return output + 2
              }
              if (curbyte & 0x1) {
                return output + 3
              }
              return output + 4
            }
            dyn_get_16 = function (data, m, k) {
              var bitsInPrefix, offs, result, stream, v
              offs = data.bitPosition
              stream = data.peek(32 - offs) << offs
              bitsInPrefix = lead(~stream)
              if (bitsInPrefix >= MAX_PREFIX_16) {
                data.advance(MAX_PREFIX_16 + MAX_DATATYPE_BITS_16)
                stream <<= MAX_PREFIX_16
                result = stream >>> (32 - MAX_DATATYPE_BITS_16)
              } else {
                data.advance(bitsInPrefix + k)
                stream <<= bitsInPrefix + 1
                v = stream >>> (32 - k)
                result = bitsInPrefix * m + v - 1
                if (v < 2) {
                  result -= v - 1
                } else {
                  data.advance(1)
                }
              }
              return result
            }
            dyn_get_32 = function (data, m, k, maxbits) {
              var offs, result, stream, v
              offs = data.bitPosition
              stream = data.peek(32 - offs) << offs
              result = lead(~stream)
              if (result >= MAX_PREFIX_32) {
                data.advance(MAX_PREFIX_32)
                return data.read(maxbits)
              } else {
                data.advance(result + 1)
                if (k !== 1) {
                  stream <<= result + 1
                  result *= m
                  v = stream >>> (32 - k)
                  data.advance(k - 1)
                  if (v > 1) {
                    result += v - 1
                    data.advance(1)
                  }
                }
              }
              return result
            }
            Aglib.ag_params = function (m, p, k, f, s, maxrun) {
              return {
                mb: m,
                mb0: m,
                pb: p,
                kb: k,
                wb: (1 << k) - 1,
                qb: QB - p,
                fw: f,
                sw: s,
                maxrun: maxrun,
              }
            }
            Aglib.dyn_decomp = function (params, data, pc, samples, maxSize) {
              var c, j, k, kb, m, mb, multiplier, mz, n, ndecode, pb, wb, zmode, _i
              ;((pb = params.pb), (kb = params.kb), (wb = params.wb), (mb = params.mb0))
              zmode = 0
              c = 0
              while (c < samples) {
                m = mb >>> QBSHIFT
                k = Math.min(31 - lead(m + 3), kb)
                m = (1 << k) - 1
                n = dyn_get_32(data, m, k, maxSize)
                ndecode = n + zmode
                multiplier = -(ndecode & 1) | 1
                pc[c++] = ((ndecode + 1) >>> 1) * multiplier
                mb = pb * (n + zmode) + mb - ((pb * mb) >> QBSHIFT)
                if (n > N_MAX_MEAN_CLAMP) {
                  mb = N_MEAN_CLAMP_VAL
                }
                zmode = 0
                if (mb << MMULSHIFT < QB && c < samples) {
                  zmode = 1
                  k = lead(mb) - BITOFF + ((mb + MOFF) >> MDENSHIFT)
                  mz = ((1 << k) - 1) & wb
                  n = dyn_get_16(data, mz, k)
                  if (!(c + n <= samples)) {
                    return false
                  }
                  for (j = _i = 0; _i < n; j = _i += 1) {
                    pc[c++] = 0
                  }
                  if (n >= 65535) {
                    zmode = 0
                  }
                  mb = 0
                }
              }
              return true
            }
            return Aglib
          })()
          module.exports = Aglib
        }).call(this)
      },
      {},
    ],
    2: [
      function (require, module, exports) {
        ;(function () {
          var ALACDecoder,
            AV,
            Aglib,
            Dplib,
            Matrixlib,
            __hasProp = {}.hasOwnProperty,
            __extends = function (child, parent) {
              for (var key in parent) {
                if (__hasProp.call(parent, key)) child[key] = parent[key]
              }

              function ctor() {
                this.constructor = child
              }
              ctor.prototype = parent.prototype
              child.prototype = new ctor()
              child.__super__ = parent.prototype
              return child
            }
          AV = window.AV
          Aglib = require('./ag_dec')
          Dplib = require('./dp_dec')
          Matrixlib = require('./matrix_dec')
          ALACDecoder = (function (_super) {
            var ID_CCE, ID_CPE, ID_DSE, ID_END, ID_FIL, ID_LFE, ID_PCE, ID_SCE
            __extends(ALACDecoder, _super)

            function ALACDecoder() {
              return ALACDecoder.__super__.constructor.apply(this, arguments)
            }
            AV.Decoder.register('alac', ALACDecoder)
            ID_SCE = 0
            ID_CPE = 1
            ID_CCE = 2
            ID_LFE = 3
            ID_DSE = 4
            ID_PCE = 5
            ID_FIL = 6
            ID_END = 7
            ALACDecoder.prototype.setCookie = function (cookie) {
              var _base = this.format,
                data = AV.Stream.fromBuffer(cookie),
                predictorBuffer
              if (data.peekString(4, 4) === 'frma') {
                data.advance(12)
              }
              if (data.peekString(4, 4) === 'alac') {
                data.advance(12)
              }
              this.config = {
                frameLength: data.readUInt32(),
                compatibleVersion: data.readUInt8(),
                bitDepth: data.readUInt8(),
                pb: data.readUInt8(),
                mb: data.readUInt8(),
                kb: data.readUInt8(),
                numChannels: data.readUInt8(),
                maxRun: data.readUInt16(),
                maxFrameBytes: data.readUInt32(),
                avgBitRate: data.readUInt32(),
                sampleRate: data.readUInt32(),
              }
              _base.bitsPerChannel = this.config.bitDepth
              _base.channelsPerFrame = this.config.numChannels
              _base.sampleRate = this.config.sampleRate
              this.mixBuffers = [
                new Int32Array(this.config.frameLength),
                new Int32Array(this.config.frameLength),
              ]
              predictorBuffer = new ArrayBuffer(this.config.frameLength * 4)
              this.predictor = new Int32Array(predictorBuffer)
              return (this.shiftBuffer = new Int16Array(predictorBuffer))
            }
            ALACDecoder.prototype.readChunk = function (data) {
              var buf,
                bytesShifted,
                ch,
                chanBits,
                channelIndex,
                channels,
                coefs,
                count,
                dataByteAlignFlag,
                denShift,
                elementInstanceTag,
                end,
                escapeFlag,
                i,
                j,
                kb,
                maxRun,
                mb,
                mixBits,
                mixRes,
                mode,
                num,
                numChannels,
                out16,
                output,
                params,
                partialFrame,
                pb,
                pbFactor,
                samples,
                shift,
                shiftbits,
                status,
                table,
                tag,
                unused,
                val,
                _i,
                _j,
                _k,
                _l,
                _m,
                _n,
                _o,
                _ref,
                _ref1,
                _ref2
              if (!this.stream.available(4)) {
                return
              }
              data = this.bitstream
              samples = this.config.frameLength
              numChannels = this.config.numChannels
              channelIndex = 0
              output = new ArrayBuffer((samples * numChannels * this.config.bitDepth) / 8)
              end = false
              while (!end) {
                tag = data.read(3)
                switch (tag) {
                  case ID_SCE:
                  case ID_LFE:
                  case ID_CPE:
                    channels = tag === ID_CPE ? 2 : 1
                    if (channelIndex + channels > numChannels) {
                      throw new Error('Too many channels!')
                    }
                    elementInstanceTag = data.read(4)
                    unused = data.read(12)
                    if (unused !== 0) {
                      throw new Error('Unused part of header does not contain 0, it should')
                    }
                    partialFrame = data.read(1)
                    bytesShifted = data.read(2)
                    escapeFlag = data.read(1)
                    if (bytesShifted === 3) {
                      throw new Error("Bytes are shifted by 3, they shouldn't be")
                    }
                    if (partialFrame) {
                      samples = data.read(32)
                    }
                    if (escapeFlag === 0) {
                      shift = bytesShifted * 8
                      chanBits = this.config.bitDepth - shift + channels - 1
                      mixBits = data.read(8)
                      mixRes = data.read(8)
                      mode = []
                      denShift = []
                      pbFactor = []
                      num = []
                      coefs = []
                      for (ch = _i = 0; _i < channels; ch = _i += 1) {
                        mode[ch] = data.read(4)
                        denShift[ch] = data.read(4)
                        pbFactor[ch] = data.read(3)
                        num[ch] = data.read(5)
                        table = coefs[ch] = new Int16Array(32)
                        for (i = _j = 0, _ref = num[ch]; _j < _ref; i = _j += 1) {
                          table[i] = data.read(16)
                        }
                      }
                      if (bytesShifted) {
                        shiftbits = data.copy()
                        data.advance(shift * channels * samples)
                      }
                      ;((_ref1 = this.config),
                        (mb = _ref1.mb),
                        (pb = _ref1.pb),
                        (kb = _ref1.kb),
                        (maxRun = _ref1.maxRun))
                      for (ch = _k = 0; _k < channels; ch = _k += 1) {
                        params = Aglib.ag_params(
                          mb,
                          (pb * pbFactor[ch]) / 4,
                          kb,
                          samples,
                          samples,
                          maxRun
                        )
                        status = Aglib.dyn_decomp(params, data, this.predictor, samples, chanBits)
                        if (!status) {
                          throw new Error('Error in Aglib.dyn_decomp')
                        }
                        if (mode[ch] === 0) {
                          Dplib.unpc_block(
                            this.predictor,
                            this.mixBuffers[ch],
                            samples,
                            coefs[ch],
                            num[ch],
                            chanBits,
                            denShift[ch]
                          )
                        } else {
                          Dplib.unpc_block(
                            this.predictor,
                            this.predictor,
                            samples,
                            null,
                            31,
                            chanBits,
                            0
                          )
                          Dplib.unpc_block(
                            this.predictor,
                            this.mixBuffers[ch],
                            samples,
                            coefs[ch],
                            num[ch],
                            chanBits,
                            denShift[ch]
                          )
                        }
                      }
                    } else {
                      chanBits = this.config.bitDepth
                      shift = 32 - chanBits
                      for (i = _l = 0; _l < samples; i = _l += 1) {
                        for (ch = _m = 0; _m < channels; ch = _m += 1) {
                          val = (data.read(chanBits) << shift) >> shift
                          this.mixBuffers[ch][i] = val
                        }
                      }
                      mixBits = mixRes = 0
                      bytesShifted = 0
                    }
                    if (bytesShifted) {
                      shift = bytesShifted * 8
                      for (i = _n = 0, _ref2 = samples * channels; _n < _ref2; i = _n += 1) {
                        this.shiftBuffer[i] = shiftbits.read(shift)
                      }
                    }
                    switch (this.config.bitDepth) {
                      case 16:
                        out16 = new Int16Array(output, channelIndex)
                        if (channels === 2) {
                          Matrixlib.unmix16(
                            this.mixBuffers[0],
                            this.mixBuffers[1],
                            out16,
                            numChannels,
                            samples,
                            mixBits,
                            mixRes
                          )
                        } else {
                          j = 0
                          buf = this.mixBuffers[0]
                          for (i = _o = 0; _o < samples; i = _o += 1) {
                            out16[j] = buf[i]
                            j += numChannels
                          }
                        }
                        break
                      case 24:
                        out16 = new Int8Array(output, channelIndex)
                        if (channels === 2) {
                          Matrixlib.unmix24(
                            this.mixBuffers[0],
                            this.mixBuffers[1],
                            out16,
                            numChannels,
                            samples,
                            mixBits,
                            mixRes,
                            this.shiftBuffer,
                            bytesShifted
                          )
                        } else {
                          throw new Error(
                            'Only supports stereo channel in 24bit Apple Lossless now.'
                          )
                        }
                        break
                      case 32:
                        out16 = new Int32Array(output, channelIndex)
                        if (channels === 2) {
                          Matrixlib.unmix32(
                            this.mixBuffers[0],
                            this.mixBuffers[1],
                            out16,
                            numChannels,
                            samples,
                            mixBits,
                            mixRes,
                            this.shiftBuffer,
                            bytesShifted
                          )
                        } else {
                          throw new Error(
                            'Only supports stereo channel in 32bit Apple Lossless now.'
                          )
                        }
                        break
                      default:
                        throw new Error('Only supports 16bit, 24bit and 32bit now.')
                        break
                    }
                    channelIndex += channels
                    break
                  case ID_CCE:
                  case ID_PCE:
                    throw new Error('Unsupported element: ' + tag)
                    break
                  case ID_DSE:
                    elementInstanceTag = data.read(4)
                    dataByteAlignFlag = data.read(1)
                    count = data.read(8)
                    if (count === 255) {
                      count += data.read(8)
                    }
                    if (dataByteAlignFlag) {
                      data.align()
                    }
                    data.advance(count * 8)
                    if (!(data.pos < data.length)) {
                      throw new Error('buffer overrun')
                    }
                    break
                  case ID_FIL:
                    count = data.read(4)
                    if (count === 15) {
                      count += data.read(8) - 1
                    }
                    data.advance(count * 8)
                    if (!(data.pos < data.length)) {
                      throw new Error('buffer overrun')
                    }
                    break
                  case ID_END:
                    data.align()
                    end = true
                    break
                  default:
                    throw new Error('Unknown element: ' + tag)
                }
                if (channelIndex > numChannels) {
                  throw new Error('Channel index too large.')
                }
              }
              // Padding to 32bit
              var i32Array = new Int32Array(samples * numChannels),
                i
              switch (this.config.bitDepth) {
                case 16:
                  return new Int16Array(output)
                case 24:
                  var v = new DataView(output),
                    j = 1
                  for (i = 0; i < samples * numChannels; ++i, j += 3) {
                    var byteHigh = v.getInt16(j, true)
                    var byteLow = v.getUint8(j - 1, true)
                    i32Array[i] = (byteHigh << 8) | byteLow
                  }
                  return i32Array
                case 32:
                  return new Int32Array(output)
                default:
                  throw new Error('Only supports 16bit, 24bit and 32bit now.')
                  break
              }
            }
            return ALACDecoder
          })(AV.Decoder)
          module.exports = ALACDecoder
        }).call(this)
      },
      {
        './ag_dec': 1,
        './dp_dec': 3,
        './matrix_dec': 4,
      },
    ],
    3: [
      function (require, module, exports) {
        ;(function () {
          var Dplib
          Dplib = (function () {
            var copy

            function Dplib() {}
            copy = function (dst, dstOffset, src, srcOffset, n) {
              var destination, source
              destination = new Uint8Array(dst, dstOffset, n)
              source = new Uint8Array(src, srcOffset, n)
              destination.set(source)
              return dst
            }
            Dplib.unpc_block = function (pc1, out, num, coefs, active, chanbits, denshift) {
              var a0,
                a1,
                a2,
                a3,
                a4,
                a5,
                a6,
                a7,
                b0,
                b1,
                b2,
                b3,
                b4,
                b5,
                b6,
                b7,
                chanshift,
                dd,
                del,
                del0,
                denhalf,
                i,
                j,
                lim,
                offset,
                prev,
                sg,
                sgn,
                sum1,
                top,
                _i,
                _j,
                _k,
                _l,
                _m,
                _n,
                _o,
                _p,
                _ref,
                _ref1
              chanshift = 32 - chanbits
              denhalf = 1 << (denshift - 1)
              out[0] = pc1[0]
              if (active === 0) {
                return copy(out, 0, pc1, 0, num * 4)
              }
              if (active === 31) {
                prev = out[0]
                for (i = _i = 1; _i < num; i = _i += 1) {
                  del = pc1[i] + prev
                  prev = (del << chanshift) >> chanshift
                  out[i] = prev
                }
                return
              }
              for (i = _j = 1; _j <= active; i = _j += 1) {
                del = pc1[i] + out[i - 1]
                out[i] = (del << chanshift) >> chanshift
              }
              lim = active + 1
              if (active === 4) {
                ;((a0 = coefs[0]), (a1 = coefs[1]), (a2 = coefs[2]), (a3 = coefs[3]))
                for (j = _k = lim; _k < num; j = _k += 1) {
                  top = out[j - lim]
                  offset = j - 1
                  b0 = top - out[offset]
                  b1 = top - out[offset - 1]
                  b2 = top - out[offset - 2]
                  b3 = top - out[offset - 3]
                  sum1 = (denhalf - a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3) >> denshift
                  del = del0 = pc1[j]
                  sg = (-del >>> 31) | (del >> 31)
                  del += top + sum1
                  out[j] = (del << chanshift) >> chanshift
                  if (sg > 0) {
                    sgn = (-b3 >>> 31) | (b3 >> 31)
                    a3 -= sgn
                    del0 -= 1 * ((sgn * b3) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b2 >>> 31) | (b2 >> 31)
                    a2 -= sgn
                    del0 -= 2 * ((sgn * b2) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b1 >>> 31) | (b1 >> 31)
                    a1 -= sgn
                    del0 -= 3 * ((sgn * b1) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    a0 -= (-b0 >>> 31) | (b0 >> 31)
                  } else if (sg < 0) {
                    sgn = -((-b3 >>> 31) | (b3 >> 31))
                    a3 -= sgn
                    del0 -= 1 * ((sgn * b3) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b2 >>> 31) | (b2 >> 31))
                    a2 -= sgn
                    del0 -= 2 * ((sgn * b2) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b1 >>> 31) | (b1 >> 31))
                    a1 -= sgn
                    del0 -= 3 * ((sgn * b1) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    a0 += (-b0 >>> 31) | (b0 >> 31)
                  }
                }
                coefs[0] = a0
                coefs[1] = a1
                coefs[2] = a2
                coefs[3] = a3
              } else if (active === 8) {
                ;((a0 = coefs[0]),
                  (a1 = coefs[1]),
                  (a2 = coefs[2]),
                  (a3 = coefs[3]),
                  (a4 = coefs[4]),
                  (a5 = coefs[5]),
                  (a6 = coefs[6]),
                  (a7 = coefs[7]))
                for (j = _l = lim; _l < num; j = _l += 1) {
                  top = out[j - lim]
                  offset = j - 1
                  b0 = top - out[offset]
                  b1 = top - out[offset - 1]
                  b2 = top - out[offset - 2]
                  b3 = top - out[offset - 3]
                  b4 = top - out[offset - 4]
                  b5 = top - out[offset - 5]
                  b6 = top - out[offset - 6]
                  b7 = top - out[offset - 7]
                  sum1 =
                    (denhalf -
                      a0 * b0 -
                      a1 * b1 -
                      a2 * b2 -
                      a3 * b3 -
                      a4 * b4 -
                      a5 * b5 -
                      a6 * b6 -
                      a7 * b7) >>
                    denshift
                  del = del0 = pc1[j]
                  sg = (-del >>> 31) | (del >> 31)
                  del += top + sum1
                  out[j] = (del << chanshift) >> chanshift
                  if (sg > 0) {
                    sgn = (-b7 >>> 31) | (b7 >> 31)
                    a7 -= sgn
                    del0 -= 1 * ((sgn * b7) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b6 >>> 31) | (b6 >> 31)
                    a6 -= sgn
                    del0 -= 2 * ((sgn * b6) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b5 >>> 31) | (b5 >> 31)
                    a5 -= sgn
                    del0 -= 3 * ((sgn * b5) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b4 >>> 31) | (b4 >> 31)
                    a4 -= sgn
                    del0 -= 4 * ((sgn * b4) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b3 >>> 31) | (b3 >> 31)
                    a3 -= sgn
                    del0 -= 5 * ((sgn * b3) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b2 >>> 31) | (b2 >> 31)
                    a2 -= sgn
                    del0 -= 6 * ((sgn * b2) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    sgn = (-b1 >>> 31) | (b1 >> 31)
                    a1 -= sgn
                    del0 -= 7 * ((sgn * b1) >> denshift)
                    if (del0 <= 0) {
                      continue
                    }
                    a0 -= (-b0 >>> 31) | (b0 >> 31)
                  } else if (sg < 0) {
                    sgn = -((-b7 >>> 31) | (b7 >> 31))
                    a7 -= sgn
                    del0 -= 1 * ((sgn * b7) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b6 >>> 31) | (b6 >> 31))
                    a6 -= sgn
                    del0 -= 2 * ((sgn * b6) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b5 >>> 31) | (b5 >> 31))
                    a5 -= sgn
                    del0 -= 3 * ((sgn * b5) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b4 >>> 31) | (b4 >> 31))
                    a4 -= sgn
                    del0 -= 4 * ((sgn * b4) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b3 >>> 31) | (b3 >> 31))
                    a3 -= sgn
                    del0 -= 5 * ((sgn * b3) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b2 >>> 31) | (b2 >> 31))
                    a2 -= sgn
                    del0 -= 6 * ((sgn * b2) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    sgn = -((-b1 >>> 31) | (b1 >> 31))
                    a1 -= sgn
                    del0 -= 7 * ((sgn * b1) >> denshift)
                    if (del0 >= 0) {
                      continue
                    }
                    a0 += (-b0 >>> 31) | (b0 >> 31)
                  }
                }
                coefs[0] = a0
                coefs[1] = a1
                coefs[2] = a2
                coefs[3] = a3
                coefs[4] = a4
                coefs[5] = a5
                coefs[6] = a6
                coefs[7] = a7
              } else {
                for (i = _m = lim; _m < num; i = _m += 1) {
                  sum1 = 0
                  top = out[i - lim]
                  offset = i - 1
                  for (j = _n = 0; _n < active; j = _n += 1) {
                    sum1 += coefs[j] * (out[offset - j] - top)
                  }
                  del = del0 = pc1[i]
                  sg = (-del >>> 31) | (del >> 31)
                  del += top + ((sum1 + denhalf) >> denshift)
                  out[i] = (del << chanshift) >> chanshift
                  if (sg > 0) {
                    for (j = _o = _ref = active - 1; _o >= 0; j = _o += -1) {
                      dd = top - out[offset - j]
                      sgn = (-dd >>> 31) | (dd >> 31)
                      coefs[j] -= sgn
                      del0 -= (active - j) * ((sgn * dd) >> denshift)
                      if (del0 <= 0) {
                        break
                      }
                    }
                  } else if (sg < 0) {
                    for (j = _p = _ref1 = active - 1; _p >= 0; j = _p += -1) {
                      dd = top - out[offset - j]
                      sgn = (-dd >>> 31) | (dd >> 31)
                      coefs[j] += sgn
                      del0 -= (active - j) * ((-sgn * dd) >> denshift)
                      if (del0 >= 0) {
                        break
                      }
                    }
                  }
                }
              }
            }
            return Dplib
          })()
          module.exports = Dplib
        }).call(this)
      },
      {},
    ],
    4: [
      function (require, module, exports) {
        ;(function () {
          var Matrixlib
          Matrixlib = (function () {
            function Matrixlib() {}
            Matrixlib.unmix16 = function (u, v, out, stride, samples, mixbits, mixres) {
              var i, l, _i, _j
              if (mixres === 0) {
                for (i = _i = 0; _i < samples; i = _i += 1) {
                  out[i * stride + 0] = u[i]
                  out[i * stride + 1] = v[i]
                }
              } else {
                for (i = _j = 0; _j < samples; i = _j += 1) {
                  l = u[i] + v[i] - ((mixres * v[i]) >> mixbits)
                  out[i * stride + 0] = l
                  out[i * stride + 1] = l - v[i]
                }
              }
            }
            Matrixlib.unmix24 = function (
              u,
              v,
              out,
              stride,
              samples,
              mixbits,
              mixres,
              shiftUV,
              bytesShifted
            ) {
              var shift = bytesShifted * 8,
                HBYTE = 2,
                MBYTE = 1,
                LBYTE = 0
              var j,
                k,
                l = 0x0000,
                r = 0x0000
              if (mixres != 0) {
                /* matrixed stereo */
                if (bytesShifted !== 0) {
                  for (j = 0, k = 0; j < samples; j++, k += 2) {
                    l = u[j] + v[j] - ((mixres * v[j]) >> mixbits)
                    r = l - v[j]
                    l = (l << shift) | shiftUV[k + 0]
                    r = (r << shift) | shiftUV[k + 1]
                    out[HBYTE] = (l >> 16) & 0x00ff
                    out[MBYTE] = (l >> 8) & 0x00ff
                    out[LBYTE] = (l >> 0) & 0x00ff
                    // out += 3;
                    HBYTE += 3
                    MBYTE += 3
                    LBYTE += 3
                    out[HBYTE] = (r >> 16) & 0x00ff
                    out[MBYTE] = (r >> 8) & 0x00ff
                    out[LBYTE] = (r >> 0) & 0x00ff
                    // out += (stride - 1) * 3;
                    HBYTE += (stride - 1) * 3
                    MBYTE += (stride - 1) * 3
                    LBYTE += (stride - 1) * 3
                  }
                } else {
                  for (j = 0; j < samples; j++) {
                    l = u[j] + v[j] - ((mixres * v[j]) >> mixbits)
                    r = l - v[j]
                    out[HBYTE] = (l >> 16) & 0x00ff
                    out[MBYTE] = (l >> 8) & 0x00ff
                    out[LBYTE] = (l >> 0) & 0x00ff
                    // out += 3;
                    HBYTE += 3
                    MBYTE += 3
                    LBYTE += 3
                    out[HBYTE] = (r >> 16) & 0x00ff
                    out[MBYTE] = (r >> 8) & 0x00ff
                    out[LBYTE] = (r >> 0) & 0x00ff
                    // out += (stride - 1) * 3;
                    HBYTE += (stride - 1) * 3
                    MBYTE += (stride - 1) * 3
                    LBYTE += (stride - 1) * 3
                  }
                }
              } else {
                /* Conventional separated stereo. */
                if (bytesShifted !== 0) {
                  for (j = 0, k = 0; j < samples; j++, k += 2) {
                    l = u[j]
                    r = v[j]
                    l = (l << shift) | shiftUV[k + 0]
                    r = (r << shift) | shiftUV[k + 1]
                    out[HBYTE] = (l >> 16) & 0x00ff
                    out[MBYTE] = (l >> 8) & 0x00ff
                    out[LBYTE] = (l >> 0) & 0x00ff
                    // out += 3;
                    HBYTE += 3
                    MBYTE += 3
                    LBYTE += 3
                    out[HBYTE] = (r >> 16) & 0x00ff
                    out[MBYTE] = (r >> 8) & 0x00ff
                    out[LBYTE] = (r >> 0) & 0x00ff
                    // out += (stride - 1) * 3;
                    HBYTE += (stride - 1) * 3
                    MBYTE += (stride - 1) * 3
                    LBYTE += (stride - 1) * 3
                  }
                } else {
                  for (j = 0; j < samples; j++) {
                    var val = 0x0000
                    val = u[j]
                    out[HBYTE] = (val >> 16) & 0x00ff
                    out[MBYTE] = (val >> 8) & 0x00ff
                    out[LBYTE] = (val >> 0) & 0x00ff
                    // out += 3;
                    HBYTE += 3
                    MBYTE += 3
                    LBYTE += 3
                    val = v[j]
                    out[HBYTE] = (val >> 16) & 0x00ff
                    out[MBYTE] = (val >> 8) & 0x00ff
                    out[LBYTE] = (val >> 0) & 0x00ff
                    // out += (stride - 1) * 3;
                    HBYTE += (stride - 1) * 3
                    MBYTE += (stride - 1) * 3
                    LBYTE += (stride - 1) * 3
                  }
                }
              }
            }
            Matrixlib.unmix32 = function (
              u,
              v,
              out,
              stride,
              samples,
              mixbits,
              mixres,
              shiftUV,
              bytesShifted
            ) {
              var shift = bytesShifted * 8,
                j,
                k,
                l,
                r
              if (mixres !== 0) {
                /* matrixed stereo with shift */
                for (j = 0, k = 0; j < samples; j++, k += 2) {
                  var lt, rt
                  lt = u[j]
                  rt = v[j]
                  l = lt + rt - ((mixres * rt) >> mixbits)
                  r = l - rt
                  out[stride * j + 0] = (l << shift) | (shiftUV[k + 0] & 0xffff)
                  out[stride * j + 1] = (r << shift) | (shiftUV[k + 1] & 0xffff)
                }
              } else {
                if (bytesShifted === 0) {
                  /* interleaving w/o shift */
                  for (j = 0; j < samples; j++) {
                    out[stride * j + 0] = u[j] & 0xffff
                    out[stride * j + 1] = v[j] & 0xffff
                  }
                } else {
                  /* interleaving with shift */
                  for (j = 0, k = 0; j < samples; j++, k += 2) {
                    out[stride * j + 0] = (u[j] << shift) | (shiftUV[k + 0] & 0xffff)
                    out[stride * j + 1] = (v[j] << shift) | (shiftUV[k + 1] & 0xffff)
                  }
                }
              }
            }
            return Matrixlib
          })()
          module.exports = Matrixlib
        }).call(this)
      },
      {},
    ],
  },
  {},
  [2]
)
//# sourceMappingURL=alac.js.map
