import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ObjectIdColumn,
    ObjectId
} from 'typeorm';

@Entity({ name: 'users' })
export class MySQLUser extends BaseEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column({ unique: true })
        uuid: string;

    @Column({ unique: true })
        username: string;

    @Column({ unique: true })
        ekoTag: string;

    @Column({ unique: true })
        email: string;

    @Column({ unique: true })
        password: string;

    @Column({ default: 'No description yet' })
        description: string;

    @Column({ nullable: true })
        profilePicture: string;

    @Column({ nullable: true })
        bannerPicture: string;

    @Column({ nullable: true })
        location: string;

    @Column({ type: 'json', default: '[]' })
        badges: string[];

    @Column({ nullable: true })
        joinedDate: string;

    @Column({ type: 'json', default: '[]' })
        followedInterests: string[];

    @Column({ default: 0 })
        followersCount: number;

    @Column({ default: 0 })
        followingCount: number;

    @Column({ type: 'json', default: '[]' })
        followers: string[];

    @Column({ type: 'json', default: '[]' })
        following: string[];
}

@Entity({ name: 'users' })
export class MongoDBUser extends BaseEntity {
    @ObjectIdColumn()
        _id: ObjectId;

    @Column({ unique: true })
        uuid: string;

    @Column({ unique: true })
        username: string;

    @Column({ unique: true })
        ekoTag: string;

    @Column({ unique: true })
        email: string;

    @Column({ unique: true })
        password: string;

    @Column({ default: 'No description yet' })
        description: string;

    @Column({ nullable: true })
        profilePicture: string;

    @Column({ nullable: true })
        bannerPicture: string;

    @Column({ nullable: true })
        location: string;

    @Column({ type: 'json', default: '[]' })
        badges: string[];

    @Column({ nullable: true })
        joinedDate: string;

    @Column({ type: 'json', default: '[]' })
        followedInterests: string[];

    @Column({ default: 0 })
        followersCount: number;

    @Column({ default: 0 })
        followingCount: number;

    @Column({ type: 'json', default: '[]' })
        followers: string[];

    @Column({ type: 'json', default: '[]' })
        following: string[];
}
