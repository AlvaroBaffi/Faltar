import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../domain/user/user.repository';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.senha, 10);
    const user = await this.userRepository.create({
      ...dto,
      senha: hashedPassword,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      access_token: token,
      user: { id: user.id, nome: user.nome, email: user.email, universidade: user.universidade },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      access_token: token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        universidade: user.universidade,
        limiteFaltas: user.limiteFaltas,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      universidade: user.universidade,
      limiteFaltas: user.limiteFaltas,
    };
  }

  async updateProfile(userId: string, data: Partial<{ nome: string; universidade: string; limiteFaltas: number }>) {
    return this.userRepository.update(userId, data);
  }
}
